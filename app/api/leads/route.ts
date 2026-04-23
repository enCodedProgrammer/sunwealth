import { z } from "zod";
import { createAdminClient } from "@/lib/db/admin";
import { scoreLead } from "@/lib/automation/lead-scoring";

export const runtime = "nodejs";

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().or(z.literal("")),
  interest: z.enum(["sales", "rent", "land", "other"]),
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid body";
    return json({ error: message }, 400);
  }

  const supabase = createAdminClient();

  const categoryMap: Record<typeof body.interest, string[]> = {
    sales: [],
    rent: [],
    land: ["land"],
    other: [],
  };

  const notes = [
    `Interest: ${body.interest}`,
    "",
    body.message.trim(),
  ].join("\n");

  // Dedupe by email or phone.
  let existingId: string | null = null;
  const filters: string[] = [`email.eq.${body.email}`];
  if (body.phone) filters.push(`phone.eq.${body.phone}`);
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .or(filters.join(","))
    .limit(1)
    .maybeSingle();
  if (existing) existingId = (existing as { id: string }).id;

  const row = {
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    whatsapp: body.phone || null,
    source: "website",
    last_contact_at: new Date().toISOString(),
    notes,
    interested_categories: categoryMap[body.interest],
  };

  let leadId: string;
  try {
    if (existingId) {
      const { error } = await supabase.from("leads").update(row).eq("id", existingId);
      if (error) throw error;
      leadId = existingId;
    } else {
      const { data, error } = await supabase
        .from("leads")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;
      leadId = (data as { id: string }).id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/leads] persist failed:", message);
    return json({ error: "Could not save your enquiry. Please try again." }, 500);
  }

  // Score in the background — don't block the form submission on it.
  void runScoringInBackground(leadId);

  return json({ ok: true }, 200);
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function runScoringInBackground(leadId: string): Promise<void> {
  try {
    await scoreLead(leadId);
  } catch (err) {
    console.warn(`[api/leads] scoreLead(${leadId}) failed:`, err);
  }
}
