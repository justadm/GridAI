FROM node:22-bookworm-slim

ARG OPENCLAW_VERSION=2026.3.28

ENV HOME=/home/node \
    TERM=xterm-256color

RUN npm install -g "openclaw@${OPENCLAW_VERSION}" \
  && mkdir -p /home/node/.openclaw/workspace \
  && chown -R node:node /home/node

USER node
WORKDIR /home/node

ENTRYPOINT ["openclaw"]
