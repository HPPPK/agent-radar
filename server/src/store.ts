import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DigestSchema, type Digest } from "./schema.js";

export class DigestStore {
  constructor(private readonly dataDir: string) {}

  async init(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
  }

  async dates(): Promise<string[]> {
    await this.init();
    const files = await readdir(this.dataDir);
    return files
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .map((name) => name.slice(0, -5))
      .sort()
      .reverse();
  }

  async get(date: string): Promise<Digest | null> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    try {
      const raw = await readFile(path.join(this.dataDir, date + ".json"), "utf8");
      return DigestSchema.parse(JSON.parse(raw.replace(/^\uFEFF/, "")));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return null;
      throw error;
    }
  }

  async latest(): Promise<Digest | null> {
    const [latestDate] = await this.dates();
    return latestDate ? this.get(latestDate) : null;
  }

  async save(input: unknown): Promise<Digest> {
    await this.init();
    const digest = DigestSchema.parse(input);
    const target = path.join(this.dataDir, digest.date + ".json");
    const temp = target + ".tmp";
    await writeFile(temp, JSON.stringify(digest, null, 2) + "\n", "utf8");
    await rename(temp, target);
    return digest;
  }
}
