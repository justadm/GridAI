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
