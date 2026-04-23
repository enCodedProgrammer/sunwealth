import "server-only";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const JOURNAL_CATEGORIES = [
  "Market",
  "Legal",
  "Diaspora",
  "Areas",
  "Inspection Stories",
] as const;

export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];

export type JournalArticleMeta = {
  slug: string;
  title: string;
  excerpt: string;
  category: JournalCategory;
  author: string;
  publishedAt: string;
  readingMinutes: number;
  coverImage?: string;
  coverAlt?: string;
  relatedAreas?: string[];
  relatedCategories?: string[];
};

export type JournalArticle = JournalArticleMeta & {
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "journal");

export async function listArticles(): Promise<JournalArticleMeta[]> {
  const files = await readdir(CONTENT_DIR).catch(() => [] as string[]);
  const mdx = files.filter((f) => f.endsWith(".mdx"));

  const metas = await Promise.all(
    mdx.map(async (filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = await readFile(path.join(CONTENT_DIR, filename), "utf8");
      const { data } = splitFrontmatter(raw);
      return normaliseMeta(slug, data);
    }),
  );

  return metas.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getArticle(slug: string): Promise<JournalArticle | null> {
  const filename = path.join(CONTENT_DIR, `${slug}.mdx`);
  let raw: string;
  try {
    raw = await readFile(filename, "utf8");
  } catch {
    return null;
  }
  const { data, body } = splitFrontmatter(raw);
  return { ...normaliseMeta(slug, data), body };
}

export async function listSlugs(): Promise<string[]> {
  const files = await readdir(CONTENT_DIR).catch(() => [] as string[]);
  return files.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
}

// Tiny YAML frontmatter parser. We only support `key: value`, `key: [a, b]`,
// and `key: "quoted string"`. That's all we need — no dependency.
function splitFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) {
    return { data: {}, body: raw };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };
  const block = raw.slice(4, end);
  const bodyStart = raw.indexOf("\n", end + 4);
  const body = bodyStart === -1 ? "" : raw.slice(bodyStart + 1);

  const data: Record<string, unknown> = {};
  for (const line of block.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = /^([A-Za-z0-9_]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    const rawValue = match[2].trim();
    data[key] = parseYamlScalar(rawValue);
  }
  return { data, body };
}

function parseYamlScalar(value: string): unknown {
  if (!value) return "";
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (/^\d+$/.test(value)) return Number(value);
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function normaliseMeta(slug: string, data: Record<string, unknown>): JournalArticleMeta {
  const category = (data.category as string | undefined) ?? "Market";
  const validCategory = (
    JOURNAL_CATEGORIES as readonly string[]
  ).includes(category)
    ? (category as JournalCategory)
    : "Market";

  return {
    slug,
    title: String(data.title ?? slug),
    excerpt: String(data.excerpt ?? ""),
    category: validCategory,
    author: String(data.author ?? "Sunwealth"),
    publishedAt: String(data.publishedAt ?? new Date().toISOString()),
    readingMinutes: Number(data.readingMinutes ?? 4),
    coverImage: (data.coverImage as string | undefined) ?? undefined,
    coverAlt: (data.coverAlt as string | undefined) ?? undefined,
    relatedAreas: Array.isArray(data.relatedAreas)
      ? (data.relatedAreas as string[])
      : undefined,
    relatedCategories: Array.isArray(data.relatedCategories)
      ? (data.relatedCategories as string[])
      : undefined,
  };
}
