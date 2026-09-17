# Security Policy

## Supported versions

Security fixes are provided for the latest published 0.1.x release. Users should update to the newest release before reporting a problem.

## Report a vulnerability

Please do not disclose an unpatched vulnerability, credential, or private user data in a public GitHub issue. Email hpppk@qq.com with the subject `[Agent Radar Security]` and include:

- Affected version or commit.
- Reproduction steps and expected impact.
- Whether credentials or personal data may be exposed.
- A safe proof of concept, if available.

The operator will acknowledge good-faith reports as soon as reasonably possible, investigate, and coordinate a fix or disclosure timeline. Do not access data that is not yours, disrupt the service, or perform social engineering.

## Security boundaries

Public MCP tools are intended to be read-only. Administrative publishing requires a server-side credential. The repository must never contain production credentials, SMTP authorization codes, private keys, subscriber lists, or unredacted production logs.

## Release checks

Before release, maintainers should run:

```powershell
python scripts/security_audit.py
cd server
npm audit --omit=dev --audit-level=high
npm run check
```

## Credential exposure

If a credential is committed, remove it from use immediately, rotate it at the provider, review access logs, then clean the repository history. Deleting only the visible file is not sufficient.
