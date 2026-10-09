# Pinnacle Objection Lab

A practice tool for Certified Pinnacle Business Guides covering the objections owners raise in first conversations, including EOS®. It has five parts:

- **Objections**: 28 objections (money, timing, trust and fit, doing it ourselves, process, and three EOS® groups). Each has what it may mean, a five-step path (acknowledge, ask with follow-up questions, land one point, show it, leave room for no), what to avoid, and a source.
- **Lessons**: 12 conversation lessons plus a "where the time goes" guide to a first conversation.
- **EOS® to Pinnacle**: shows each EOS term next to its closest Pinnacle tool.
- **Drill**: write your reply, run a pattern check, compare it with the model path, and track which objections you've drilled.
- **Role-play with Claude**: a live chat where Claude plays a prospect, then scores the guide on seven points. On the public site guides can speak their replies and hear the prospect. A copy-prompt fallback remains for anyone without live access.

Drill progress and the guide passcode are saved only in the viewer's own browser.

## How live role-play works

| Where it's opened | What runs it | Who pays |
|---|---|---|
| Public site (GitHub Pages) | `worker/`, a Cloudflare Worker (`pinnacle-roleplay`, Apogee account) that calls the Claude API with Brian's key | Brian's Anthropic API account |
| Claude Artifact | The artifact's built-in Claude access (`sample` capability) | Each viewer's own Claude plan |

The Worker accepts only requests from the Pages origin with the right guide passcode, and stops at 200 replies a day overall and 60 per IP (soft caps in KV). It uses `claude-haiku-5-5` (low effort for prospect turns, medium for feedback), about a third of a cent per role-play. `MODEL` in `worker/wrangler.jsonc` switches it.

The hard ceiling is the Anthropic side: the API key lives in its own workspace (`objection-lab`) with a monthly spend limit, so the bill cannot pass that number whatever happens to the passcode.

The role-play rules live in one place, `src/roleplay-prompt.js`. The Worker imports it and `build.py` inlines it into the page.

Secrets, set once by Brian from `worker/` (never in a file):

```
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put GUIDE_PASSCODE
```

Redeploy the Worker after editing it or the prompt file: `cd worker && npx wrangler deploy`.

Pinnacle marks are used with Pinnacle Business Guides' permission (confirmed by Brian Vinci, 2026-10-09).

## Files

| File | What it is |
|---|---|
| `src/app.html` | The source. Edit this one. |
| `assets/pinnacle-logo.png` | Pinnacle horizontal logo, embedded at build time. |
| `build.py` | Builds both outputs below. Run `python3 build.py` after any edit. |
| `objection-lab.html` | The build that gets published as the Claude Artifact. |
| `index.html` | A standalone build for GitHub Pages or any static host. |

## Published

- **For guides (no login):** https://bvinci1-design.github.io/pinnacle-objection-lab/ (GitHub Pages, serves `index.html` from `main`)
- Claude Artifact: https://claude.ai/artifact/EoK1QAF6oMHhQCHHKrhuHf (private, Brian's working copy)

To update both, run `python3 build.py`, commit and push for Pages, and republish `objection-lab.html` to the artifact.

## Feedback loop

Guides leave feedback without leaving the app: a Helpful / Needs work row on every card, a 1–5 rating after each role-play (prospect realism and feedback usefulness, with an opt-in transcript), and a **Send feedback** button for bugs, ideas and missing objections. The Worker's `/feedback` route stores it in the D1 database `objection-lab-feedback` (passcode-gated, 60 submissions per person per day).

```
python3 tools/feedback.py            # digest of new feedback
python3 tools/feedback.py show 12    # one item with its transcript
python3 tools/feedback.py resolve 12 done "what changed"
```

The full triage-fix-ship-close workflow, including what ships without Brian's sign-off, is in `.claude/skills/objection-lab-feedback/SKILL.md`. Tests: `sh tests/run.sh`.

## Editing content

All content lives in arrays at the top of the script in `src/app.html`: `OBJ` (objections), `LESSONS`, `MAP` (the translator), and `PERSONAS` (role-play prospects). Keep the same rules when adding content:

- Never say anything negative about EOS®, an Implementer, a prospect's coach or their do-it-yourself approach. Describe the difference instead.
- Write all content in original wording. Don't paste text from books or paid training material.
- Every claim about EOS® must trace to a public source. The current source is EOS Worldwide's Franchise Disclosure Document, as summarized on apogeeleadership.co.
- Never include pricing.
- Don't use "coaching", "consulting" or "implementing" to describe what guides do.
