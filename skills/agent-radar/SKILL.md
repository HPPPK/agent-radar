---
name: agent-radar
description: Read and explain the latest Agent technology and GitHub Trending digest. Use when users ask what changed in AI agents, which repositories are worth learning, what a technical term means, or what they should try next.
---

# Agent Radar

Use the Agent Radar MCP tools as the source of truth for daily digest data.

## Workflow

1. Start with `get_latest_digest` for the current brief.
2. Use `list_agent_updates` when the user asks about Agent tools, MCP, coding agents, research agents, skills, plugins, RAG, observability, or security.
3. Use `list_github_projects` when the user asks what a repository does, what it is useful for, or which projects are worth trying.
4. Use `explain_agent_term` for unfamiliar professional terms.
5. Use `get_digest_by_date` only when the user explicitly asks for a historical date.

## Explanation style

- Preserve the accurate professional name.
- Immediately follow it with a plain-language explanation.
- Explain concrete use cases and who should care.
- Distinguish a formal Release from a Commit, experiment, or popularity signal.
- Do not claim a Trending repository released a new version unless the digest has official release evidence.
- If the source says information is insufficient, say so instead of guessing.
- Prefer concise Chinese unless the user requests another language.

## Recommended answer shape

1. 今天最值得看的 3 件事
2. 每项的“大白话、用途、为什么重要”
3. 用户现在可以采取的行动
4. Official source links when available

## Provenance and review labels

- Always preserve the source URL and source type returned by the MCP tool.
- Treat `api_verified` as a link/API existence check, not proof that every sentence was manually fact-checked.
- Only say “已人工复核” when `human_reviewed` is true.
- When `human_reviewed` is false, tell the user to verify important decisions against the original source.
- Do not hide the AI-assistance notice.
