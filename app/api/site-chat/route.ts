// app/api/site-chat/route.ts — Next.js App Router endpoint for the site chat widget.
// Replaces the generic Vercel function. Expects ANTHROPIC_API_KEY in env.

import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatBody {
  messages: ChatMessage[];
  config: {
    persona?: string;
    brand?: string;
    system_prompt: string;
    kb_url?: string;
  };
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { messages, config } = body;
  if (!Array.isArray(messages) || !config?.system_prompt) {
    return Response.json({ error: "messages[] and config.system_prompt required" }, { status: 400 });
  }

  // Pull KB (RAG-lite — single JSON blob fetched from same origin).
  let kb = "";
  if (config.kb_url) {
    try {
      const origin = new URL(req.url).origin;
      const kbRes = await fetch(origin + config.kb_url, { cache: "no-store" });
      if (kbRes.ok) {
        const kbJson = await kbRes.json();
        kb = JSON.stringify(kbJson).slice(0, 30000);
      }
    } catch { /* fallback to empty kb */ }
  }

  const system = `${config.system_prompt}

Knowledge base (this site):
${kb}

Rules:
- Answer ONLY from the knowledge base or the brand voice above.
- If asked about another brand in this ecosystem, point to that brand's site.
- Never make medical claims that exceed the source material.
- Keep answers under 120 words unless the user asks for detail.
- Cite the page or section name when possible.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const reply = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = reply.content.find((c) => c.type === "text");
    const replyText = text && text.type === "text" ? text.text : "";
    return Response.json({ reply: replyText, sources: [] });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
