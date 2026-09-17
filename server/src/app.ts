import crypto from "node:crypto";
import path from "node:path";
import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";
import { DigestStore } from "./store.js";
import { filterAgentUpdates, filterGithubItems } from "./summary.js";

export interface AppOptions {
  publicDir: string;
  adminApiKey?: string;
}

function authorized(request: Request, expected?: string): boolean {
  if (!expected) return false;
  const value = request.header("authorization") ?? "";
  const supplied = value.startsWith("Bearer ") ? value.slice(7) : "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function createHttpApp(store: DigestStore, options: AppOptions): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.static(options.publicDir, { index: false, maxAge: "5m" }));

  app.get("/healthz", async (_request: Request, response: Response) => {
    const dates = await store.dates();
    response.json({ ok: true, service: "agent-radar", latest: dates[0] ?? null });
  });

  app.get("/api/v1/digests", async (_request: Request, response: Response) => {
    response.json({ dates: await store.dates() });
  });

  app.get("/api/v1/digests/latest", async (_request: Request, response: Response) => {
    const digest = await store.latest();
    if (!digest) return response.status(404).json({ error: "No digest is available yet." });
    response.json(digest);
  });

  app.get("/api/v1/digests/:date", async (request: Request, response: Response) => {
    const date = Array.isArray(request.params.date) ? request.params.date[0] : request.params.date;
    const digest = await store.get(date);
    if (!digest) return response.status(404).json({ error: "Digest not found." });
    response.json(digest);
  });

  app.get("/api/v1/search", async (request: Request, response: Response) => {
    const digest = await store.latest();
    if (!digest) return response.status(404).json({ error: "No digest is available yet." });
    const query = typeof request.query.q === "string" ? request.query.q : "";
    const limit = Math.min(Math.max(Number(request.query.limit) || 10, 1), 30);
    response.json({
      date: digest.date,
      query,
      agent_updates: filterAgentUpdates(digest, query, limit),
      github_items: filterGithubItems(digest, query, limit),
      glossary: digest.glossary.filter((item) => (item.term + " " + item.explanation).toLocaleLowerCase().includes(query.toLocaleLowerCase())),
    });
  });

  app.post("/api/admin/digests", async (request: Request, response: Response) => {
    if (!authorized(request, options.adminApiKey)) return response.status(401).json({ error: "Unauthorized." });
    try {
      const digest = await store.save(request.body);
      response.status(201).json({ ok: true, date: digest.date, agent_updates: digest.agent_updates.length, github_items: digest.github_items.length });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : "Invalid digest." });
    }
  });

  app.get("/privacy", (_request: Request, response: Response) => response.sendFile(path.join(options.publicDir, "privacy.html")));
  app.get("/terms", (_request: Request, response: Response) => response.sendFile(path.join(options.publicDir, "terms.html")));
  app.get("/", (_request: Request, response: Response) => response.sendFile(path.join(options.publicDir, "index.html")));

  return app;
}
