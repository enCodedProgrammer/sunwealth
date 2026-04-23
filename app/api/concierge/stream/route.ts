import { z } from "zod";
import {
  getOrCreateConversation,
  runConciergeTurn,
  type ConciergeEvent,
} from "@/lib/ai/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  clientContext: z
    .object({
      propertySlug: z.string().optional(),
      propertyTitle: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid body";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const conversation = await getOrCreateConversation({
    sessionId: body.sessionId,
    channel: "website",
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ConciergeEvent) => {
        const frame = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(frame));
      };

      try {
        // If already escalated, bail immediately — hard mute enforced here AND
        // inside runConciergeTurn.
        if (conversation.escalated) {
          send({ type: "escalated", agentName: "a senior agent" });
          send({ type: "done" });
          controller.close();
          return;
        }

        const userText = prefixWithClientContext(body.message, body.clientContext);

        await runConciergeTurn({
          conversationId: conversation.id,
          sessionId: body.sessionId,
          channel: "website",
          ip,
          userText,
          push: send,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[concierge/stream] error:", err);
        send({ type: "error", message: "Something went wrong. Please try again." });
        // Still log the real error server-side via console; never leak to client.
        void message;
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

function prefixWithClientContext(
  message: string,
  ctx?: { propertySlug?: string; propertyTitle?: string },
): string {
  if (!ctx?.propertySlug) return message;
  // Tell the model which page the user is on without polluting the visible
  // message. The user's own words come last so they dominate the turn.
  return [
    `[context: user is viewing property ${ctx.propertyTitle ?? ctx.propertySlug} (slug: ${ctx.propertySlug})]`,
    message,
  ].join("\n\n");
}
