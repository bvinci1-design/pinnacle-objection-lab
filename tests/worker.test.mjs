// Worker tests: run the bundled Worker in Node against fake KV and D1 (no network, no API key).
// Usage: node tests/worker.test.mjs <path to bundled index.js from `wrangler deploy --dry-run --outdir`>
const bundle = process.argv[2];
const worker = (await import(bundle)).default;

const kvStore = new Map();
const KV = { get: async (k) => kvStore.get(k) ?? null, put: async (k, v) => { kvStore.set(k, v); } };
const rows = [];
const D1 = { prepare: (sql) => ({ bind: (...args) => ({ run: async () => { rows.push({ sql, args }); return { success: true }; } }) }) };
const env = { GUIDE_PASSCODE: "local-test-pass", ANTHROPIC_API_KEY: "test-key-not-real", LIMITS: KV, FEEDBACK: D1,
  ALLOWED_ORIGINS: "https://bvinci1-design.github.io", MODEL: "claude-haiku-5-5", DAILY_CAP: "200", DAILY_CAP_PER_IP: "60" };

const ORIGIN = "https://bvinci1-design.github.io";
const call = (path, body, origin = ORIGIN) => worker.fetch(new Request("https://w.example" + path, {
  method: "POST", headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": "203.0.113.9" }, body: JSON.stringify(body) }), env);

const results = []; const t = (name, ok) => results.push((ok ? "PASS " : "FAIL ") + name);
const st = async (p) => { const r = await p; return { status: r.status, body: await r.json() }; };

// Guards
t("foreign origin refused", (await st(call("/feedback", {}, "https://evil.example"))).status === 403);
t("bad passcode refused", (await st(call("/feedback", { passcode: "nope", kind: "general", message: "x" }))).status === 401);
t("unknown kind refused", (await st(call("/feedback", { passcode: "local-test-pass", kind: "spam", message: "x" }))).status === 400);
t("empty feedback refused", (await st(call("/feedback", { passcode: "local-test-pass", kind: "general" }))).status === 400);

// Saves
let r = await st(call("/feedback", { passcode: " local-test-pass ", kind: "card", target: "cost", helpful: false, message: "Ask step is too long", name: "Jo" }));
t("card feedback saved", r.status === 200 && rows.length === 1 && rows[0].args[0] === "card" && rows[0].args[1] === "cost" && rows[0].args[2] === 0 && rows[0].args[6] === "Ask step is too long");
r = await st(call("/feedback", { passcode: "local-test-pass", kind: "roleplay", target: "loyal|working", rating_realism: 4, rating_feedback: 9, message: "good", transcript: "Prospect: hi" }));
t("roleplay saved, out-of-range rating dropped", r.status === 200 && rows[1].args[3] === 4 && rows[1].args[4] === null && rows[1].args[7] === "Prospect: hi");
r = await st(call("/feedback", { passcode: "local-test-pass", kind: "general", target: "bug", message: "x".repeat(5000), transcript: "should be dropped" }));
t("long message capped, transcript only on roleplay", r.status === 200 && rows[2].args[6].length === 2000 && rows[2].args[7] === null);

// Role-play validation (stops before calling Claude)
t("roleplay bad turns refused", (await st(call("/roleplay", { passcode: "local-test-pass", turns: [{ role: "assistant", content: "x" }] }))).status === 400);
t("roleplay non-array refused", (await st(call("/roleplay", { passcode: "local-test-pass", turns: "x" }))).status === 400);

// Feedback cap per IP (60/day): pre-fill the counter
const day = new Date().toISOString().slice(0, 10);
kvStore.set(`fb:ip:203.0.113.9:${day}`, "60");
t("feedback daily cap enforced", (await st(call("/feedback", { passcode: "local-test-pass", kind: "general", message: "x" }))).status === 429);

console.log(results.join("\n"));
process.exit(results.some((x) => x.startsWith("FAIL")) ? 1 : 0);
