# OpenClaw migration on `msk`

## Current state

Legacy OpenClaw on `msk` is installed as:

- global npm package in `/usr/lib/node_modules/openclaw`
- systemd service `openclaw-gateway.service`
- state in `/var/lib/openclaw/.openclaw`
- public proxy at `https://bot.devee.ru`

Installed version on server:

- `openclaw@2026.2.9`

Latest npm version seen from server:

- `2026.3.28`

## Models

Current OpenClaw config uses only OpenRouter free models:

- `openrouter/openai/gpt-oss-20b:free`
- `openrouter/arcee-ai/trinity-mini:free`
- `openrouter/qwen/qwen3-next-80b-a3b-instruct:free`

Current Ollama on `msk` is already running and exposes `0.0.0.0:11434`.

Installed Ollama models:

- `gpt-oss:20b-cloud`
- `qwen3.5:397b-cloud`
- `qwen2.5:0.5b`
- `qwen2.5:7b-instruct`

## Migration strategy

### Phase 1. Parallel Docker canary

- build a fresh Docker image with newer OpenClaw
- copy `.openclaw` state into `/opt/openclaw-docker/canary/.openclaw`
- disable Telegram in the canary state
- run gateway on `18791`
- bind canary as `loopback`, not `lan`
- test local health, auth, UI behavior and compatibility

### Phase 2. Model switch evaluation

- decide whether to keep OpenRouter defaults
- or move primary/fallbacks to Ollama-backed models on `msk`
- validate response quality and latency before cutover

Current fact:

- new OpenClaw canary accepts `ollama/gpt-oss:20b-cloud` as a valid model id
- so there is no syntax blocker for moving from OpenRouter to Ollama later

### Phase 2a. Ollama canary

Target for the first Ollama-backed canary step:

- switch only the Docker canary default model to `ollama/gpt-oss:20b-cloud`
- keep legacy production gateway on OpenRouter and systemd untouched
- keep Telegram disabled in canary to avoid duplicate bot traffic
- verify that Docker health reflects the real gateway state

Important note:

- the gateway exposes HTTPS with an auto-generated local certificate
- Docker healthcheck must ignore local self-signed TLS, otherwise the container becomes falsely `unhealthy` while `/healthz` still returns `200`

Result on `2026-03-30`:

- canary default model switched to `ollama/gpt-oss:20b-cloud`
- fallbacks were kept on OpenRouter for rollback safety:
  - `openrouter/arcee-ai/trinity-mini:free`
  - `openrouter/qwen/qwen3-next-80b-a3b-instruct:free`
- Docker healthcheck fixed and canary reached `healthy`
- gateway runtime logs confirmed `agent model: ollama/gpt-oss:20b-cloud`
- local `https://127.0.0.1:18791/healthz` returned `200 OK`
- legacy production gateway on `18789` was not touched

Observed caveat:

- even with Ollama as primary, OpenClaw still performs some provider bootstrap work and prints non-fatal noise like `xai-auth bootstrap config fallback`
- this is not a blocker for the canary, but before public cutover it is worth minimizing unused provider config if we want cleaner startup and fewer external dependencies

Recommended next step before cutover:

1. validate real chat/task execution through the canary UI
2. decide whether to keep OpenRouter fallbacks or go Ollama-only
3. only after that repoint `bot.devee.ru` from legacy systemd to the Docker canary

## Temporary canary access

To validate the Docker canary externally without touching the production `443` upstream, expose it on a separate TLS port:

- `https://bot.devee.ru:4443/` -> Docker canary on `127.0.0.1:18791`
- keep `https://bot.devee.ru/` on `443` pointing to legacy `18789`

Why this shape:

- no extra DNS record is required
- wildcard certificate for `*.devee.ru` already covers `bot.devee.ru`
- OpenClaw UI can stay mounted at `/` and keep its normal `/gateway` path
- rollback is trivial: close the extra listener and keep `443` untouched

Expected validation through `4443`:

- browser reaches the OpenClaw control UI after nginx Basic Auth
- websocket path `/gateway` upgrades successfully
- chat/task execution uses `ollama/gpt-oss:20b-cloud` as primary

Actual result on `2026-03-30`:

- separate nginx listener was added on `4443`
- `ufw` was updated to allow `4443/tcp`
- external check passed: `https://bot.devee.ru:4443/` returns `401 OpenClaw Canary`
- production `https://bot.devee.ru/` on `443` remains unchanged and still returns `401 OpenClaw`

Operational note:

- legacy gateway on `18789` is already showing OpenRouter free-tier degradation
- `systemctl status openclaw-gateway` contains repeated `429` and `No available auth profile for openrouter`
- this makes the Ollama-backed Docker canary not just a migration exercise, but the likely path to restore stable interactive usage

### Phase 3. Cutover

- repoint nginx `bot.devee.ru` to the Docker canary
- stop legacy `openclaw-gateway.service`
- keep legacy state and service available for rollback

## Why not switch to Ollama immediately

Switching package version, runtime model provider, gateway path ownership and deployment mode in one step creates too many moving parts.

The safer order is:

1. migrate runtime to Docker
2. verify functional parity
3. then switch model provider if needed
