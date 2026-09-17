import type { AgentUpdate, Digest, GithubItem } from "./schema.js";

export function matchesQuery(values: Array<string | undefined>, query?: string): boolean {
  if (!query?.trim()) return true;
  const needle = query.trim().toLocaleLowerCase();
  return values.some((value) => (value ?? "").toLocaleLowerCase().includes(needle));
}

export function filterAgentUpdates(digest: Digest, query?: string, limit = 10): AgentUpdate[] {
  return digest.agent_updates
    .filter((item) => matchesQuery([item.title, item.category, item.plain_explanation, item.change, item.use_case, item.why], query))
    .slice(0, limit);
}

export function filterGithubItems(digest: Digest, query?: string, limit = 20): GithubItem[] {
  return digest.github_items
    .filter((item) => matchesQuery([item.name, item.description, item.plain_summary, item.use_case, item.audience], query))
    .slice(0, limit);
}

export function digestText(digest: Digest): string {
  const top = digest.top_agent.map((item, index) => String(index + 1) + ". " + item.title + "：" + item.summary).join("\n");
  return "Agent Radar " + digest.date + "\n" + digest.content_notice + "\nAgent 更新 " + digest.agent_updates.length + " 条，GitHub Trending " + digest.github_items.length + " 项。\n\n今天只看这 3 件事：\n" + top;
}
