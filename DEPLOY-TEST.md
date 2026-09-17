# Private test deployment (no domain)

This profile runs Agent Radar on the server loopback address only. It does not bind a new public port and does not use Caddy, port 80, or port 443.

## Start

```bash
export ADMIN_API_KEY="$(openssl rand -hex 32)"
docker compose -f docker-compose.test.yml up -d --build
curl http://127.0.0.1:8788/healthz
```

The existing service on port 8787 is not part of this compose project. Keep the default project directory name or pass an explicit project name such as `-p agent-radar-test`.

## Verify

```bash
docker compose -p agent-radar-test -f docker-compose.test.yml ps
curl http://127.0.0.1:8788/
curl http://127.0.0.1:8788/privacy
curl http://127.0.0.1:8788/terms
```

## Stop

```bash
docker compose -p agent-radar-test -f docker-compose.test.yml down
```
