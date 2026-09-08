import { useDeckStore } from "../lib/useStore";
import { TopBar } from "./TopBar";
import { StatusPanel } from "./StatusPanel";
import { EventFeed } from "./EventFeed";
import { TaskTimeline } from "./TaskTimeline";

export function HudOverlay() {
  const activeFlow = useDeckStore((s) => s.activeFlow);

  return (
    <>
      <TopBar />
      {activeFlow && (
        <>
          <StatusPanel />
          <EventFeed />
          <TaskTimeline />
        </>
      )}
    </>
  );
}
