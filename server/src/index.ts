import path from "node:path";
import type { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createHttpApp } from "./app.js";
import { buildMcpServer } from "./mcp.js";
import { DigestStore } from "./store.js";

const cwd = process.cwd();
const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(cwd, "data"));
const publicDir = path.resolve(process.env.PUBLIC_DIR ?? path.join(cwd, "public"));
const publicBaseUrl = (process.env.PUBLIC_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const widgetPath = path.join(publicDir, "widget.html");
const port = Number(process.env.PORT ?? 8080);

const store = new DigestStore(dataDir);
await store.init();
const app = createHttpApp(store, { publicDir, adminApiKey: process.env.ADMIN_API_KEY });

app.post("/mcp", async (request: Request, response: Response) => {
  const server = await buildMcpServer(store, widgetPath, publicBaseUrl);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  response.on("close", () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  } catch (error) {
    console.error("MCP request failed", error);
    if (!response.headersSent) response.status(500).json({ error: "MCP request failed." });
  }
});

app.get("/mcp", (_request: Request, response: Response) => response.status(405).json({ error: "Use POST for stateless MCP requests." }));
app.delete("/mcp", (_request: Request, response: Response) => response.status(405).json({ error: "Stateless MCP sessions do not require DELETE." }));

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ ok: true, service: "agent-radar", port, dataDir, publicBaseUrl }));
});
