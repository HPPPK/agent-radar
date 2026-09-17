# Deployment checklist

## Status

The repository is ready for private/local testing. Do not treat this file as proof that a public mainland-China deployment, ICP filing, public-security filing, or OpenAI directory submission has been approved.

## Required from the operator before public deployment

- A domain name controlled by the operator.
- Any filing or registration required for the server location and service type.
- HTTPS and a public privacy-policy, terms, and support URL.
- Docker Engine with the Compose plugin.
- A long random `ADMIN_API_KEY` stored outside Git.
- A final check of data location, log retention, source licenses, and platform eligibility.

## Start the service after prerequisites are satisfied

```bash
cp .env.example .env
# Edit AGENT_RADAR_DOMAIN and ADMIN_API_KEY
docker compose up -d --build
docker compose ps
curl https://YOUR_DOMAIN/healthz
```

Caddy obtains and renews HTTPS after DNS resolves and ports 80/443 are available. Check that these ports do not conflict with existing services before starting the public compose profile.

## Publish a daily digest

```bash
export AGENT_RADAR_BASE_URL=https://YOUR_DOMAIN
export AGENT_RADAR_ADMIN_API_KEY=YOUR_SECRET
python scripts/publish_digest.py /path/to/agent-github-email-YYYY-MM-DD.json
```

Never put the real key in shell history, Git, an issue, a screenshot, or an image layer. Prefer an environment-file or secret manager with restricted permissions. The public tools are read-only; only the administrative endpoint accepts writes.

## Connect the plugin

Set `AGENT_RADAR_MCP_URL=https://YOUR_DOMAIN/mcp` when installing the plugin package. Use true identity and location information for any platform verification. Do not bypass regional, identity, or access restrictions.

## Before public submission

- Run `python scripts/security_audit.py`.
- Run `npm audit --omit=dev --audit-level=high` and `npm run check` under `server/`.
- Host privacy and terms at stable HTTPS URLs.
- Confirm the public privacy notice matches actual logs, infrastructure, and processors.
- Run prompt-injection and tool-description tests.
- Confirm all MCP tools have accurate read-only annotations.
- Verify source attribution, provenance fields, and data freshness.
- Test the widget on desktop and mobile.
- Prepare screenshots and a monitored support contact.
