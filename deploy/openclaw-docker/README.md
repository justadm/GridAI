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
- public cutover: not enabled yet
- Telegram: disabled in canary state to avoid duplicate bot activity

## Why the canary uses a copied state

The legacy instance owns the real `.openclaw` state and Telegram bindings.
Running two gateways against the same live state is unsafe.

The canary should use a copied state with these changes:

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

Suggested external validation path:

- publish the canary on `https://bot.devee.ru:4443/`
- keep production `https://bot.devee.ru/` on `443` pointing to legacy
- use the same nginx Basic Auth file and the canary gateway token from the copied state
- remember to open `4443/tcp` in `ufw` on `msk`
