# OpenClaw Docker Canary on `msk`

This directory contains the parallel Docker canary for migrating the legacy systemd-based OpenClaw installation.

## Goal

Bring up a newer OpenClaw in Docker on a separate port without touching the current production gateway on `18789`.

## Current legacy install on `msk`

- systemd unit: `/etc/systemd/system/openclaw-gateway.service`
- package: `/usr/lib/node_modules/openclaw`
- config: `/var/lib/openclaw/.openclaw/openclaw.json`
- public URL: `https://bot.devee.ru`

## Canary target

- host path: `/opt/openclaw-docker/canary`
- gateway port: `18791`
- bind mode: `loopback`
- public cutover: enabled on `2026-03-30`
- Telegram: enabled after cutover

## Why the canary uses a copied state

The legacy instance owns the real `.openclaw` state and Telegram bindings.
Running two gateways against the same live state is unsafe.

The canary started from a copied state with these changes:

- `channels.telegram.enabled = false`
- `gateway.port = 18791`
- keep the rest of the agent and auth configuration intact for compatibility testing

## Models found on `msk`

Current legacy OpenClaw uses only OpenRouter:

- `openrouter/openai/gpt-oss-20b:free`
- `openrouter/arcee-ai/trinity-mini:free`
- `openrouter/qwen/qwen3-next-80b-a3b-instruct:free`

Existing Ollama on `msk` already has:

- `gpt-oss:20b-cloud`
- `qwen3.5:397b-cloud`
- `qwen2.5:0.5b`
- `qwen2.5:7b-instruct`

This means there is model overlap by family, but not yet by provider configuration.
The first canary step should preserve OpenRouter behavior; switching to Ollama is a second step.

Validation already done on canary:

- OpenClaw `2026.3.28` accepts model ids in the form `ollama/gpt-oss:20b-cloud`
- this means the model switch can be done later without changing the deployment shape again
- healthcheck must explicitly ignore self-signed local TLS for `https://127.0.0.1:18791/healthz`
- canary was switched to `ollama/gpt-oss:20b-cloud` and reached Docker `healthy`
- current conservative setup keeps OpenRouter fallbacks until UI/task validation is finished

Final production shape after cutover:

- production `https://bot.devee.ru/` on `443` now points to Docker canary on `127.0.0.1:18791`
- temporary validation entry `https://bot.devee.ru:4443/` remains available as a separate listener
- legacy systemd OpenClaw is stopped but kept installed for rollback
- Telegram polling now runs from the Docker canary

Current working model profile on `msk`:

- primary: `ollama/qwen2.5:1.5b`
- fallback: `ollama/qwen2.5:0.5b`
- lightweight workspace and minimal tool profile were required for the VPS to answer in time
