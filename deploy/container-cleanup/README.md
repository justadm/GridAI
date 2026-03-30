# Container Cleanup on `msk`

This directory is the server-side home for the host-level container cleanup job.

Target path on server:

```bash
/opt/container-cleanup
```

Expected contents:

- `container_cleanup.sh` — executable cleanup script
- `.env` — Telegram destination for reports
- `.env.example` — template for `.env`
- `README.md` — quick operational reference

Run manually:

```bash
sudo /opt/container-cleanup/container_cleanup.sh daily 85
sudo /opt/container-cleanup/container_cleanup.sh weekly 85
```

Modes:

- `daily` — only `docker builder prune -af`
- `weekly` — `docker image prune -af` and `docker volume prune -f` only when `/` usage is at or above threshold

Systemd units:

- `container-cleanup-daily.service`
- `container-cleanup-daily.timer`
- `container-cleanup-weekly.service`
- `container-cleanup-weekly.timer`

Telegram:

- Reports should be configured explicitly via `/opt/container-cleanup/.env`
- Do not rely on project-specific fallback envs for the main destination
