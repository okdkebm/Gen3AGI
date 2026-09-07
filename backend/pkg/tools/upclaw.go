package tools

import (
	"context"
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"path"
	"strings"
	"time"

	"pentagi/pkg/docker"
	obs "pentagi/pkg/observability"
	"pentagi/pkg/observability/langfuse"

	"github.com/moby/moby/client"
	"github.com/sirupsen/logrus"
)

// UpClaw fusion tool: runs the vendored UpClaw CLI (an AI-driven, evidence-based
// penetration testing single-file Python tool) inside the flow's primary
// terminal container. See https://github.com/okdkebm/UpClaw (Apache-2.0).
//
// The tool is self-healing: the vendored script (upclaw/upclaw.py, embedded at
// build time) is automatically provisioned into the container on first use, so
// the stock pentest image works without rebuilding. Scans require an UpClaw
// authorization file (--auth-file) — UpClaw's compliance gate is preserved
// as-is and cannot be bypassed through this tool.

const (
	upclawScriptPath   = "/opt/upclaw/upclaw.py"
	upclawReportsRoot  = "/work/upclaw"
	upclawMaxOutput    = 6000
	upclawMaxDigest    = 8000
	upclawMaxFindingLn = 220
)

//go:embed upclaw/upclaw.py
var upclawScript string

type upclawTool struct {
	flowID       int64
	taskID       *int64
	subtaskID    *int64
	containerID  int64
	containerLID string
	tenantPrefix string
	dockerClient docker.DockerClient
	term         *terminal
}

// NewUpclawTool creates the UpClaw tool bound to the flow's primary terminal
// container. It reuses the terminal tool for user-visible command execution
// and logging, and performs quiet execs for provisioning/report plumbing.
func NewUpclawTool(
	flowID int64,
	taskID, subtaskID *int64,
	containerID int64, containerLID string,
	tenantPrefix string,
	dockerClient docker.DockerClient,
	tlp TermLogProvider,
	defaultExecTimeout time.Duration,
) Tool {
	term := &terminal{
		flowID:             flowID,
		taskID:             taskID,
		subtaskID:          subtaskID,
		containerID:        containerID,
		containerLID:       containerLID,
		tenantPrefix:       tenantPrefix,
		dockerClient:       dockerClient,
		tlp:                tlp,
		defaultExecTimeout: defaultExecTimeout,
	}
	return &upclawTool{
		flowID:       flowID,
		taskID:       taskID,
		subtaskID:    subtaskID,
		containerID:  containerID,
		containerLID: containerLID,
		tenantPrefix: tenantPrefix,
		dockerClient: dockerClient,
		term:         term,
	}
}

func (t *upclawTool) IsAvailable() bool {
	return t.dockerClient != nil && t.term != nil
}

// shellQuote quotes a value for safe use as a single POSIX shell word.
func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'"'"'`) + "'"
}

// execQuiet runs a command inside the flow's primary terminal container
// without writing to the termlog (used for provisioning and report plumbing,
// so huge bootstrap payloads don't flood the engagement log).
func (t *upclawTool) execQuiet(ctx context.Context, command string, timeout time.Duration) (string, error) {
	containerName := PrimaryTerminalName(t.tenantPrefix, t.flowID)

	isRunning, err := t.dockerClient.IsContainerRunning(ctx, t.containerLID)
	if err != nil {
		return "", fmt.Errorf("runtime verification failed: %w", err)
	}
	if !isRunning {
		return "", fmt.Errorf("container runtime is not operational")
	}

	createResp, err := t.dockerClient.ContainerExecCreate(ctx, containerName, client.ExecCreateOptions{
		Cmd:          []string{"sh", "-c", command},
		AttachStdout: true,
		AttachStderr: true,
		WorkingDir:   docker.WorkFolderPathInContainer,
		TTY:          true,
	})
	if err != nil {
		return "", fmt.Errorf("failed to create exec process: %w", err)
	}

	if timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, timeout)
		defer cancel()
	}

	resp, err := t.dockerClient.ContainerExecAttach(ctx, createResp.ID, client.ExecAttachOptions{
		TTY: true,
	})
	if err != nil {
		return "", fmt.Errorf("failed to attach to exec process: %w", err)
	}
	defer resp.Close()

	dst := &strings.Builder{}
	errChan := make(chan error, 1)
	go func() {
		_, copyErr := io.Copy(dst, resp.Reader)
		errChan <- copyErr
	}()

	select {
	case err := <-errChan:
		if err != nil && err != io.EOF {
			return "", fmt.Errorf("failed to copy output: %w", err)
		}
	case <-ctx.Done():
		resp.Close()
		<-errChan
		return "", fmt.Errorf("quiet exec timeout: %w", ctx.Err())
	}

	if _, err := t.dockerClient.ContainerExecInspect(ctx, createResp.ID); err != nil {
		return "", fmt.Errorf("failed to inspect exec process: %w", err)
	}

	return dst.String(), nil
}

// ensureInstalled verifies UpClaw is present in the container and, if not,
// provisions the vendored script (self-healing bootstrap, idempotent).
func (t *upclawTool) ensureInstalled(ctx context.Context) error {
	out, err := t.execQuiet(ctx,
		fmt.Sprintf("test -f %s && python3 %s --version", upclawScriptPath, upclawScriptPath),
		30*time.Second,
	)
	if err == nil && strings.Contains(out, "upclaw") {
		return nil
	}

	b64 := base64.StdEncoding.EncodeToString([]byte(upclawScript))
	bootstrap := fmt.Sprintf(
		"mkdir -p /opt/upclaw && printf '%%s' %s | base64 -d > %s && python3 %s --version",
		shellQuote(b64), upclawScriptPath, upclawScriptPath,
	)
	out, err = t.execQuiet(ctx, bootstrap, 120*time.Second)
	if err != nil {
		return fmt.Errorf("failed to bootstrap UpClaw into the container: %w (output: %s)", err, truncateString(out, 500))
	}
	if !strings.Contains(out, "upclaw") {
		return fmt.Errorf("UpClaw bootstrap verification failed — check that python3 (>=3.10) exists in the container (output: %s)", truncateString(out, 500))
	}
	return nil
}

// buildUpclawCommand assembles the UpClaw CLI invocation for the requested mode.
func buildUpclawCommand(action *UpclawAction, outDir string) (string, error) {
	args := []string{"python3", upclawScriptPath}

	switch action.Mode {
	case "scan":
		if strings.TrimSpace(action.Target) == "" {
			return "", fmt.Errorf("target is required for scan mode")
		}
		args = append(args, "scan", shellQuote(action.Target),
			"--auth-file", shellQuote(action.AuthFile),
			"--format", "json,html",
			"--output", shellQuote(outDir),
		)
		if action.Checks != "" {
			args = append(args, "--checks", shellQuote(action.Checks))
		}
		if action.NoExt {
			args = append(args, "--no-ext")
		}
		if action.ExtTools != "" {
			args = append(args, "--ext-tools", shellQuote(action.ExtTools))
		}
		if action.NucleiTags != "" {
			args = append(args, "--nuclei-tags", shellQuote(action.NucleiTags))
		}
		if action.NucleiSeverity != "" {
			args = append(args, "--nuclei-severity", shellQuote(action.NucleiSeverity))
		}
		if action.Ports != "" {
			args = append(args, "--ports", shellQuote(action.Ports))
		}
		if action.SkipPorts {
			args = append(args, "--skip-ports")
		}
		if action.Verbose {
			args = append(args, "-v")
		}
	case "recon":
		if strings.TrimSpace(action.Target) == "" {
			return "", fmt.Errorf("target is required for recon mode")
		}
		args = append(args, "recon", shellQuote(action.Target),
			"--auth-file", shellQuote(action.AuthFile),
		)
		if action.Ports != "" {
			args = append(args, "--ports", shellQuote(action.Ports))
		}
		if action.SkipPorts {
			args = append(args, "--skip-ports")
		}
		if action.Verbose {
			args = append(args, "-v")
		}
	case "req":
		if strings.TrimSpace(action.Target) == "" {
			return "", fmt.Errorf("target is required for req mode")
		}
		args = append(args, "req", shellQuote(action.Target))
		if action.Method != "" {
			args = append(args, "-X", shellQuote(strings.ToUpper(action.Method)))
		}
		for _, h := range action.Headers {
			args = append(args, "-H", shellQuote(h))
		}
		if action.Data != "" {
			args = append(args, "-d", shellQuote(action.Data))
		}
		for _, m := range action.Match {
			args = append(args, "-m", shellQuote(m))
		}
		if action.Verbose {
			args = append(args, "--full-body")
		}
	case "cmp":
		if strings.TrimSpace(action.Target) == "" || strings.TrimSpace(action.TargetB) == "" {
			return "", fmt.Errorf("target and target_b are required for cmp mode")
		}
		args = append(args, "cmp", shellQuote(action.Target), shellQuote(action.TargetB))
	case "doctor", "tools":
		args = append(args, action.Mode)
		if action.Mode == "doctor" && strings.TrimSpace(action.Target) != "" {
			args = append(args, shellQuote(action.Target))
		}
	default:
		return "", fmt.Errorf("unknown upclaw mode: %s", action.Mode)
	}

	return strings.Join(args, " "), nil
}

type upclawFinding struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Severity    string `json:"severity"`
	Status      string `json:"status"`
	Category    string `json:"category"`
	Target      string `json:"target"`
	Location    string `json:"location"`
	Description string `json:"description"`
	Impact      string `json:"impact"`
	Remediation string `json:"remediation"`
}

type upclawFindingsFile struct {
	Meta struct {
		Tool       string `json:"tool"`
		Version    string `json:"version"`
		Target     string `json:"target"`
		StartedAt  string `json:"started_at"`
		FinishedAt string `json:"finished_at"`
	} `json:"meta"`
	Counts   map[string]int  `json:"counts"`
	Findings []upclawFinding `json:"findings"`
}

func oneLine(s string, max int) string {
	s = strings.Join(strings.Fields(s), " ")
	if len(s) > max {
		return s[:max] + "…"
	}
	return s
}

// buildFindingsDigest reads findings.json from the container and renders a
// compact markdown digest for the agent. Errors are non-fatal: the scan stdout
// summary is still returned to the caller.
func (t *upclawTool) buildFindingsDigest(ctx context.Context, outDir string) string {
	raw, err := t.execQuiet(ctx, fmt.Sprintf("cat %s/findings.json", shellQuote(outDir)), 60*time.Second)
	if err != nil {
		return ""
	}

	var file upclawFindingsFile
	if err := json.Unmarshal([]byte(raw), &file); err != nil {
		return ""
	}

	var b strings.Builder
	fmt.Fprintf(&b, "\n\n--- UpClaw findings digest (parsed from %s/findings.json) ---\n", outDir)
	fmt.Fprintf(&b, "Target: %s | Window: %s → %s\n",
		file.Meta.Target, file.Meta.StartedAt, file.Meta.FinishedAt)

	verified, unverified := 0, 0
	for _, f := range file.Findings {
		switch f.Status {
		case "VERIFIED":
			verified++
		case "UNVERIFIED":
			unverified++
		}
	}

	counts := file.Counts
	if counts == nil {
		counts = map[string]int{}
	}
	fmt.Fprintf(&b, "Counts: CRITICAL=%d HIGH=%d MEDIUM=%d LOW=%d INFO=%d (VERIFIED=%d, UNVERIFIED=%d)\n",
		counts["CRITICAL"], counts["HIGH"], counts["MEDIUM"], counts["LOW"], counts["INFO"], verified, unverified)

	const maxListed = 12
	listed := 0
	for _, f := range file.Findings {
		if listed >= maxListed {
			remaining := len(file.Findings) - listed
			fmt.Fprintf(&b, "... and %d more findings (see findings.json)\n", remaining)
			break
		}
		fmt.Fprintf(&b, "%d. [%s][%s] %s (%s) — %s\n",
			listed+1, f.Severity, f.Status, oneLine(f.Title, upclawMaxFindingLn), f.Category, oneLine(f.Location, upclawMaxFindingLn))
		if f.Impact != "" {
			fmt.Fprintf(&b, "   impact: %s\n", oneLine(f.Impact, upclawMaxFindingLn))
		}
		if f.Remediation != "" {
			fmt.Fprintf(&b, "   remediation: %s\n", oneLine(f.Remediation, upclawMaxFindingLn))
		}
		listed++
	}

	fmt.Fprintf(&b, "Report artifacts (inside the container):\n"+
		"- HTML report: %s/report.html\n"+
		"- JSON findings: %s/findings.json\n"+
		"- Evidence trail (decision replay): %s/trace.json\n"+
		"- Raw evidence files: %s/evidence/\n"+
		"HINT: use the file tool (read_file) on report.html/trace.json or terminal 'cat' on evidence files for full request/response proof before exploitation.\n",
		outDir, outDir, outDir, outDir)

	return b.String()
}

func (t *upclawTool) Handle(ctx context.Context, name string, args json.RawMessage) (string, error) {
	if !t.IsAvailable() {
		return "", fmt.Errorf("upclaw is not available")
	}

	logger := logrus.WithContext(ctx).WithFields(enrichLogrusFields(t.flowID, t.taskID, t.subtaskID, logrus.Fields{
		"tool": name,
		"args": string(args),
	}))

	var action UpclawAction
	if err := json.Unmarshal(args, &action); err != nil {
		logger.WithError(err).Error("failed to unmarshal upclaw action")
		return "", fmt.Errorf("failed to unmarshal upclaw action: %w", err)
	}

	if action.Mode == "" {
		action.Mode = "scan"
	}
	if action.Mode == "scan" || action.Mode == "recon" {
		if strings.TrimSpace(action.AuthFile) == "" {
			return "UpClaw refuses to run without an authorization file (compliance gate, cannot be bypassed). " +
				"Create one with the file tool (write_file) at e.g. /work/upclaw-auth.json containing JSON fields: " +
				`{"authorized_by": "...", "scope": ["target.example.com"], "valid_until": "YYYY-MM-DD", "reference": "contract/ticket"}` +
				" — only for targets you have written authorization to test — then retry with auth_file set.", nil
		}
	}

	if err := t.ensureInstalled(ctx); err != nil {
		logger.WithError(err).Error("upclaw provisioning failed")
		return "", err
	}

	outDir := path.Join(upclawReportsRoot, time.Now().UTC().Format("20060102T150405Z"))
	command, err := buildUpclawCommand(&action, outDir)
	if err != nil {
		logger.WithError(err).Error("failed to build upclaw command")
		return "", err
	}

	logger = logger.WithFields(logrus.Fields{"mode": action.Mode, "command": command})
	timeout := t.term.normalizeExecTimeout(time.Duration(action.Timeout) * time.Second)
	if timeout > 0 {
		timeout += defaultExtraExecTimeout
	}

	result, err := t.term.ExecCommand(ctx, docker.WorkFolderPathInContainer, command, false, timeout)
	if err != nil {
		if obsErr := t.observeError(ctx, args, err); obsErr != nil {
			logger.WithError(obsErr).Warning("failed to record upclaw observation")
		}
		return t.wrapUpclawError(ctx, args, name, result, err)
	}

	if action.Mode == "scan" {
		if digest := t.buildFindingsDigest(ctx, outDir); digest != "" {
			result += digest
		}
	}

	if len(result) > upclawMaxOutput+upclawMaxDigest {
		result = result[:upclawMaxOutput+upclawMaxDigest] + "\n... [truncated]"
	}
	return result, nil
}

func (t *upclawTool) observeError(ctx context.Context, args json.RawMessage, err error) error {
	_, observation := obs.Observer.NewObservation(ctx)
	observation.Event(
		langfuse.WithEventName("upclaw tool error swallowed"),
		langfuse.WithEventInput(args),
		langfuse.WithEventStatus(err.Error()),
		langfuse.WithEventLevel(langfuse.ObservationLevelWarning),
		langfuse.WithEventMetadata(langfuse.Metadata{
			"tool_name": UpclawToolName,
			"error":     err.Error(),
		}),
	)
	return nil
}

func (t *upclawTool) wrapUpclawError(ctx context.Context, args json.RawMessage, name, result string, err error) (string, error) {
	logrus.WithContext(ctx).WithError(err).WithFields(logrus.Fields{
		"tool":   name,
		"result": result[:min(len(result), 1000)],
	}).Error("upclaw tool failed")
	return fmt.Sprintf("upclaw tool '%s' handled with error: %v", name, err), nil
}
