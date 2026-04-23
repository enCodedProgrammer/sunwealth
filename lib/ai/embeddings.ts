import "server-only";
import OpenAI from "openai";
import { createAdminClient } from "../db/admin";

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

let _openai: OpenAI | null = null;
function openai(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Short-lived in-process LRU. Embeddings are deterministic per (model, text),
// so within one request we avoid re-embedding identical strings.
const LRU_MAX = 128;
const cache = new Map<string, number[]>();
function cacheGet(key: string): number[] | undefined {
  const v = cache.get(key);
  if (!v) return undefined;
  cache.delete(key);
  cache.set(key, v);
  return v;
}
function cacheSet(key: string, value: number[]): void {
  if (cache.size >= LRU_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

export async function embed(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("embed: empty input");

  const cacheKey = `${EMBEDDING_MODEL}::${trimmed}`;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  const { data } = await openai().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
  });
  const vector = data[0]?.embedding;
  if (!vector || vector.length !== EMBEDDING_DIM) {
    throw new Error(`embed: unexpected embedding shape (len=${vector?.length})`);
  }
  cacheSet(cacheKey, vector);
  return vector;
}

export type KnowledgeHit = {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
};

export async function semanticSearch(
  query: string,
  k = 3,
  threshold = 0.3,
): Promise<KnowledgeHit[]> {
  const vector = await embed(query);
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("match_knowledge_documents", {
    query_embedding: vector as unknown as string,
    match_threshold: threshold,
    match_count: k,
  });

  if (error) {
    throw new Error(`semanticSearch failed: ${error.message}`);
  }

  return (data ?? []) as unknown as KnowledgeHit[];
}

// Admin-only utility: re-embed one knowledge document. Called from admin tools
// or a one-off script after seeding. Not exposed to the public runtime.
export async function reembedKnowledgeDoc(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("id, title, content")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`reembed: lookup failed: ${error.message}`);
  if (!data) throw new Error(`reembed: doc ${id} not found`);

  const row = data as { id: string; title: string; content: string };
  const vector = await embed(`${row.title}\n\n${row.content}`);

  const { error: updateError } = await supabase
    .from("knowledge_documents")
    .update({ embedding: vector as unknown as string })
    .eq("id", id);

  if (updateError) {
    throw new Error(`reembed: update failed: ${updateError.message}`);
  }
}

export async function reembedAllKnowledgeDocs(): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("id");

  if (error) throw new Error(`reembed-all: lookup failed: ${error.message}`);
  const rows = (data ?? []) as unknown as { id: string }[];

  for (const row of rows) {
    await reembedKnowledgeDoc(row.id);
  }
  return rows.length;
}
