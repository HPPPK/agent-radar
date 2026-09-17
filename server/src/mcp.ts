import { readFile } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DigestStore } from "./store.js";
import { digestText, filterAgentUpdates, filterGithubItems, matchesQuery } from "./summary.js";

const WIDGET_URI = "ui://widget/agent-radar.html";
const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

export async function buildMcpServer(store: DigestStore, widgetPath: string, publicBaseUrl: string): Promise<McpServer> {
  const widgetHtml = await readFile(widgetPath, "utf8");
  const server = new McpServer({ name: "agent-radar", version: "0.1.1" });

  server.registerResource(
    "agent-radar-widget",
    WIDGET_URI,
    {},
    async () => ({
      contents: [{
        uri: WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: widgetHtml,
        _meta: {
          "openai/widgetDescription": "Agent Radar read-only daily brief with source and review-status labels.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetCSP": {
            connect_domains: [publicBaseUrl],
            resource_domains: [],
          },
        },
      }],
    }),
  );

  server.registerTool(
    "get_latest_digest",
    {
      title: "Get the latest Agent Radar digest",
      description: "Get the latest verified Agent technology and GitHub Trending digest, including plain-language explanations, use cases, audience guidance, and terminology.",
      inputSchema: {},
      annotations: readOnly,
      _meta: { "openai/outputTemplate": WIDGET_URI },
    },
    async () => {
      const digest = await store.latest();
      if (!digest) return { content: [{ type: "text", text: "No digest is available yet." }], isError: true };
      return {
        content: [{ type: "text", text: digestText(digest) }],
        structuredContent: { digest },
      };
    },
  );

  server.registerTool(
    "get_digest_by_date",
    {
      title: "Get an Agent Radar digest by date",
      description: "Get a historical digest using an exact YYYY-MM-DD date.",
      inputSchema: { date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) },
      annotations: readOnly,
      _meta: { "openai/outputTemplate": WIDGET_URI },
    },
    async ({ date }) => {
      const digest = await store.get(date);
      if (!digest) return { content: [{ type: "text", text: "No digest was found for " + date + "." }], isError: true };
      return { content: [{ type: "text", text: digestText(digest) }], structuredContent: { digest } };
    },
  );

  server.registerTool(
    "list_agent_updates",
    {
      title: "List Agent technology updates",
      description: "Search the latest Agent updates and return professional descriptions together with plain-language explanations and concrete use cases.",
      inputSchema: {
        query: z.string().optional(),
        limit: z.number().int().min(1).max(20).optional().default(10),
      },
      annotations: readOnly,
    },
    async ({ query, limit }) => {
      const digest = await store.latest();
      if (!digest) return { content: [{ type: "text", text: "No digest is available yet." }], isError: true };
      const items = filterAgentUpdates(digest, query, limit);
      const text = items.map((item, index) => String(index + 1) + ". " + item.title + "\n大白话：" + item.plain_explanation + "\n用途：" + item.use_case + "\n来源类型：" + item.source_type + "\n人工复核：" + (item.human_reviewed ? "是" : "否") + "\n来源：" + item.source_url).join("\n\n");
      return { content: [{ type: "text", text: text || "No matching Agent updates." }], structuredContent: { date: digest.date, items } };
    },
  );

  server.registerTool(
    "list_github_projects",
    {
      title: "List GitHub projects from the daily trend",
      description: "Search the latest official-order GitHub Trending projects and explain what each project is, what it can do, and who it is for.",
      inputSchema: {
        query: z.string().optional(),
        limit: z.number().int().min(1).max(30).optional().default(20),
      },
      annotations: readOnly,
    },
    async ({ query, limit }) => {
      const digest = await store.latest();
      if (!digest) return { content: [{ type: "text", text: "No digest is available yet." }], isError: true };
      const items = filterGithubItems(digest, query, limit);
      const text = items.map((item, index) => String(index + 1) + ". " + item.name + "\n大白话：" + item.plain_summary + "\n用途：" + item.use_case + "\n适合：" + item.audience + "\n人工复核：" + (item.human_reviewed ? "是" : "否") + "\n" + item.url).join("\n\n");
      return { content: [{ type: "text", text: text || "No matching GitHub projects." }], structuredContent: { date: digest.date, items } };
    },
  );

  server.registerTool(
    "explain_agent_term",
    {
      title: "Explain an Agent term in plain language",
      description: "Explain a professional Agent or developer-tool term using the latest digest glossary.",
      inputSchema: { term: z.string().min(1) },
      annotations: readOnly,
    },
    async ({ term }) => {
      const digest = await store.latest();
      if (!digest) return { content: [{ type: "text", text: "No digest is available yet." }], isError: true };
      const item = digest.glossary.find((entry) => matchesQuery([entry.term, entry.explanation], term));
      if (!item) return { content: [{ type: "text", text: "The latest glossary does not contain a reliable explanation for " + term + "." }] };
      return { content: [{ type: "text", text: item.term + "：" + item.explanation }], structuredContent: { item } };
    },
  );

  return server;
}
