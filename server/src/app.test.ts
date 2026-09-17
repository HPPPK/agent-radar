import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHttpApp } from "./app.js";
import { DigestStore } from "./store.js";

let tempDir = "";
let store: DigestStore;
const publicDir = path.resolve(process.cwd(), "public");
const samplePath = path.resolve(process.cwd(), "data", "2026-09-17.json");

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "agent-radar-"));
  store = new DigestStore(tempDir);
  const sample = JSON.parse(await readFile(samplePath, "utf8"));
  await store.save(sample);
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("Agent Radar HTTP API", () => {
  it("reports health and the latest digest", async () => {
    const app = createHttpApp(store, { publicDir, adminApiKey: "test-secret" });
    const health = await request(app).get("/healthz").expect(200);
    expect(health.body.latest).toBe("2026-09-17");
    const latest = await request(app).get("/api/v1/digests/latest").expect(200);
    expect(latest.body.agent_updates).toHaveLength(8);
    expect(latest.body.github_items).toHaveLength(21);
  });

  it("publishes explicit provenance and review status", async () => {
    const app = createHttpApp(store, { publicDir, adminApiKey: "test-secret" });
    const latest = await request(app).get("/api/v1/digests/latest").expect(200);
    expect(latest.body.ai_assisted).toBe(true);
    expect(latest.body.human_reviewed).toBe(false);
    expect(latest.body.review_status).toBe("automated_source_check");
    expect(latest.body.content_notice).toContain("AI 辅助");
    for (const item of [...latest.body.agent_updates, ...latest.body.github_items]) {
      expect(item.source_type).toBeTruthy();
      expect(item.source_checked_at).toMatch(/^2026-09-17T/);
      expect(item.source_check_status).toBe("api_verified");
      expect(item.human_reviewed).toBe(false);
    }
  });

  it("searches plain-language fields", async () => {
    const app = createHttpApp(store, { publicDir, adminApiKey: "test-secret" });
    const response = await request(app).get("/api/v1/search?q=代码审查").expect(200);
    expect(response.body.agent_updates.length).toBeGreaterThan(0);
    expect(response.body.github_items.length).toBeGreaterThan(0);
  });

  it("protects the administrative publisher", async () => {
    const app = createHttpApp(store, { publicDir, adminApiKey: "test-secret" });
    const sample = JSON.parse(await readFile(samplePath, "utf8"));
    await request(app).post("/api/admin/digests").send(sample).expect(401);
    const response = await request(app).post("/api/admin/digests").set("Authorization", "Bearer test-secret").send(sample).expect(201);
    expect(response.body.ok).toBe(true);
  });

  it("shows AI-assistance and legal notices on public pages", async () => {
    const app = createHttpApp(store, { publicDir, adminApiKey: "test-secret" });
    const home = await request(app).get("/").expect(200);
    expect(home.text).toContain("AI 辅助整理");
    expect(home.text).toContain("独立开源项目");
    const privacy = await request(app).get("/privacy").expect(200);
    expect(privacy.text).toContain("六个月");
    expect(privacy.text).toContain("不主动记录 MCP 请求正文");
  });
});
