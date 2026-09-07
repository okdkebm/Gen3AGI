# UpClaw-enabled pentest image for PentAGI
#
# Builds on top of the default PentAGI pentest image and pre-installs UpClaw,
# the vendored AI-driven pentest CLI (see backend/pkg/tools/upclaw/upclaw.py,
# Apache-2.0, https://github.com/okdkebm/UpClaw).
#
# NOTE: pre-baking is optional. The upclaw tool in the backend self-heals: it
# provisions the embedded script into ANY flow container on first use. Use this
# image if you want UpClaw available without that first-run bootstrap.
#
# Build:
#   docker build -t vxcontrol/kali-linux-upclaw:latest -f docker/upclaw/Dockerfile .
#
# Enable (dynamic flow containers pick the image from this env var):
#   DOCKER_DEFAULT_IMAGE_FOR_PENTEST=vxcontrol/kali-linux-upclaw:latest
#   (then docker compose up -d backend)

FROM vxcontrol/kali-linux

COPY upclaw.py /opt/upclaw/upclaw.py
RUN chmod 0755 /opt/upclaw/upclaw.py && \
    printf '#!/bin/sh\nexec python3 /opt/upclaw/upclaw.py "$@"\n' > /usr/local/bin/upclaw && \
    chmod 0755 /usr/local/bin/upclaw && \
    mkdir -p /work/upclaw && \
    python3 --version && upclaw --version
