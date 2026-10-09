// Backend for the Pinnacle Objection Lab (GitHub Pages build).
// /roleplay: live role-play. Holds the Anthropic API key so the public page never sees it.
// /feedback: stores guide feedback in D1 for triage (tools/feedback.py).
// Both are guarded by a shared guide passcode, an origin allowlist, and daily caps kept in KV.
import Anthropic from "@anthropic-ai/sdk";
import { buildRoleplayRules, ROLEPLAY_KICKOFF } from "../../src/roleplay-prompt.js";

interface Env {
  ANTHROPIC_API_KEY: string;
  GUIDE_PASSCODE: string;
  LIMITS: KVNamespace;
  FEEDBACK: D1Database;
  ALLOWED_ORIGINS: string;
  MODEL: string;
  DAILY_CAP: string;
  DAILY_CAP_PER_IP: string;
}

const MAX_TURNS = 40;
const MAX_TURN_CHARS = 2000;

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  const ok = origin && (allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return ok
    ? { "Access-Control-Allow-Origin": origin!, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : { Vary: "Origin" };
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  // Log why a request was refused (the error code only, never request content).
  if (status >= 400 || (body as any)?.error) console.log(JSON.stringify({ kind: "rejected", status, error: (body as any)?.error }));
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });
}

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

// Soft daily caps. KV is eventually consistent, so these can overshoot slightly under bursts.
async function overCap(env: Env, ip: string, scope = "", caps = [parseInt(env.DAILY_CAP, 10) || 400, parseInt(env.DAILY_CAP_PER_IP, 10) || 120]): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const keys = [`${scope}all:${day}`, `${scope}ip:${ip}:${day}`];
  const counts = await Promise.all(keys.map(async (k) => parseInt((await env.LIMITS.get(k)) || "0", 10)));
  if (counts[0] >= caps[0] || counts[1] >= caps[1]) return true;
  await Promise.all(keys.map((k, i) => env.LIMITS.put(k, String(counts[i] + 1), { expirationTtl: 60 * 60 * 48 })));
  return false;
}

type Turn = { role: "user" | "assistant"; content: string };

function cleanTurns(raw: unknown): Turn[] | null {
  // An empty list is valid: it's the opening request, where the prospect speaks first.
  if (!Array.isArray(raw) || raw.length > MAX_TURNS) return null;
  const turns: Turn[] = [];
  for (const t of raw) {
    if (!t || (t.role !== "user" && t.role !== "assistant") || typeof t.content !== "string") return null;
    const content = t.content.trim().slice(0, MAX_TURN_CHARS);
    if (!content) return null;
    turns.push({ role: t.role, content });
  }
  if (turns.length > 0 && turns[turns.length - 1].role !== "user") return null;
  return turns;
}

const FEEDBACK_KINDS = new Set(["card", "roleplay", "general"]);

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t || null;
}
function rating(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

async function saveFeedback(body: any, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!FEEDBACK_KINDS.has(body.kind)) return json({ error: "bad_request" }, 400, cors);
  const row = {
    kind: body.kind as string,
    target: str(body.target, 200),
    helpful: body.helpful === true ? 1 : body.helpful === false ? 0 : null,
    rating_realism: rating(body.rating_realism),
    rating_feedback: rating(body.rating_feedback),
    name: str(body.name, 80),
    message: str(body.message, 2000),
    transcript: body.kind === "roleplay" ? str(body.transcript, 20000) : null,
    page_version: str(body.page_version, 40),
  };
  if (row.helpful === null && row.rating_realism === null && row.rating_feedback === null && !row.message) {
    return json({ error: "empty_feedback" }, 400, cors);
  }
  await env.FEEDBACK.prepare(
    "INSERT INTO feedback (kind, target, helpful, rating_realism, rating_feedback, name, message, transcript, page_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(row.kind, row.target, row.helpful, row.rating_realism, row.rating_feedback, row.name, row.message, row.transcript, row.page_version).run();
  console.log(JSON.stringify({ kind: "feedback_saved", type: row.kind, has_message: !!row.message, has_transcript: !!row.transcript }));
  return json({ ok: true }, 200, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get("Origin"), env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ ok: true }, 200, cors);
    if ((url.pathname !== "/roleplay" && url.pathname !== "/feedback") || request.method !== "POST") return json({ error: "not_found" }, 404, cors);
    if (!cors["Access-Control-Allow-Origin"]) return json({ error: "origin_not_allowed" }, 403, cors);

    let body: any;
    try { body = await request.json(); } catch { return json({ error: "bad_request" }, 400, cors); }

    if (!env.GUIDE_PASSCODE || !env.ANTHROPIC_API_KEY) return json({ error: "server_config" }, 503, cors);
    if (typeof body.passcode !== "string" || !safeEqual(body.passcode.trim(), env.GUIDE_PASSCODE.trim())) {
      return json({ error: "bad_passcode" }, 401, cors);
    }
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    if (url.pathname === "/feedback") {
      if (await overCap(env, ip, "fb:", [500, 60])) return json({ error: "daily_limit" }, 429, cors);
      return saveFeedback(body, env, cors);
    }

    const turns = cleanTurns(body.turns);
    if (!turns) return json({ error: "bad_request" }, 400, cors);
    if (await overCap(env, ip)) return json({ error: "daily_limit" }, 429, cors);

    const ending = turns.length > 0 && turns[turns.length - 1].content === "END";
    const system = buildRoleplayRules({ persona: body.persona, objection: body.objection, rounds: body.rounds, context: body.context });
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: ROLEPLAY_KICKOFF }, ...turns];

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      // Haiku 5.5: fast enough for spoken back-and-forth and a fraction of a cent per role-play.
      // Low effort for the prospect's short lines, medium for the end-of-call feedback.
      const response = await client.messages.create({
        model: env.MODEL || "claude-haiku-5-5",
        max_tokens: ending ? 4000 : 2000,
        output_config: { effort: ending ? "medium" : "low" },
        system,
        messages,
      });
      // Token counts only, never conversation text: lets `wrangler tail` show what a role-play costs.
      console.log(JSON.stringify({ kind: ending ? "feedback" : "turn", model: response.model, input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens, stop: response.stop_reason }));
      if (response.stop_reason === "refusal") return json({ error: "declined" }, 200, cors);
      const reply = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      if (!reply) return json({ error: "empty" }, 502, cors);
      return json({ reply }, 200, cors);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 503, cors);
      if (err instanceof Anthropic.AuthenticationError) return json({ error: "server_config" }, 500, cors);
      if (err instanceof Anthropic.BadRequestError) return json({ error: "bad_request" }, 400, cors);
      if (err instanceof Anthropic.APIError) return json({ error: "upstream" }, 502, cors);
      return json({ error: "upstream" }, 502, cors);
    }
  },
} satisfies ExportedHandler<Env>;
