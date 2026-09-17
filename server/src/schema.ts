import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const timestamp = z.string().datetime({ offset: true });

export const SourceTypeSchema = z.enum([
  "official_release",
  "official_commit",
  "official_repository",
  "official_documentation",
  "official_announcement",
  "github_trending",
  "community_signal",
]);

export const SourceCheckStatusSchema = z.enum(["api_verified", "reachable", "pending", "failed"]);

const provenanceShape = {
  source_type: SourceTypeSchema,
  source_checked_at: timestamp,
  source_check_status: SourceCheckStatusSchema,
  ai_assisted: z.boolean(),
  human_reviewed: z.boolean(),
};

export const TopItemSchema = z.object({
  title: nonEmpty,
  summary: nonEmpty,
  source_url: z.string().url(),
  ...provenanceShape,
}).passthrough();

export const GlossaryItemSchema = z.object({
  term: nonEmpty,
  explanation: nonEmpty,
}).passthrough();

export const AgentUpdateSchema = z.object({
  category: nonEmpty,
  priority: z.string().optional().default(""),
  maturity: z.string().optional().default(""),
  title: nonEmpty,
  published: z.string().optional().default(""),
  plain_explanation: nonEmpty,
  change: nonEmpty,
  use_case: nonEmpty,
  why: nonEmpty,
  term_explanation: nonEmpty,
  action: nonEmpty,
  source_url: z.string().url(),
  ...provenanceShape,
}).passthrough();

export const TopGithubSchema = z.object({
  name: nonEmpty,
  url: z.string().url(),
  plain_summary: nonEmpty,
  use_case: nonEmpty,
  audience: nonEmpty,
  reason: nonEmpty,
  ...provenanceShape,
}).passthrough();

export const GithubItemSchema = z.object({
  name: nonEmpty,
  url: z.string().url(),
  description: nonEmpty,
  plain_summary: nonEmpty,
  use_case: nonEmpty,
  audience: nonEmpty,
  stars: z.union([z.string(), z.number()]).transform(String),
  forks: z.union([z.string(), z.number()]).transform(String),
  stars_today: z.union([z.string(), z.number()]).transform(String),
  ...provenanceShape,
}).passthrough();

export const DigestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generated_at: timestamp,
  content_notice: nonEmpty,
  ai_assisted: z.boolean(),
  human_reviewed: z.boolean(),
  review_status: z.enum(["automated_source_check", "human_reviewed"]),
  source_policy: nonEmpty,
  top_agent: z.array(TopItemSchema).min(1).max(3),
  glossary: z.array(GlossaryItemSchema).min(1).max(12),
  agent_updates: z.array(AgentUpdateSchema),
  top_github: z.array(TopGithubSchema).max(5),
  github_items: z.array(GithubItemSchema),
  noise: z.array(z.string()).default([]),
  watch: z.array(z.string()).default([]),
}).superRefine((digest, context) => {
  const statusSaysReviewed = digest.review_status === "human_reviewed";
  if (digest.human_reviewed !== statusSaysReviewed) {
    context.addIssue({ code: "custom", message: "human_reviewed must match review_status" });
  }
}).passthrough();

export type Digest = z.infer<typeof DigestSchema>;
export type AgentUpdate = z.infer<typeof AgentUpdateSchema>;
export type GithubItem = z.infer<typeof GithubItemSchema>;
