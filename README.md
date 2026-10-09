# Pinnacle Objection Lab

A practice tool for Certified Pinnacle Business Guides covering the objections owners raise in first conversations, including EOS®. It has five parts:

- **Objections**: 28 objections (money, timing, trust and fit, doing it ourselves, process, and three EOS® groups). Each has what it may mean, a five-step path (acknowledge, ask with follow-up questions, land one point, show it, leave room for no), what to avoid, and a source.
- **Lessons**: 12 conversation lessons plus a "where the time goes" guide to a first conversation.
- **EOS® to Pinnacle**: shows each EOS term next to its closest Pinnacle tool.
- **Drill**: write your reply, run a pattern check, compare it with the model path, and track which objections you've drilled.
- **Role-play with Claude**: builds a prompt that has Claude play a prospect and then give feedback.

It needs no accounts, API keys or server. Drill progress is saved only in the viewer's own browser.

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

## Editing content

All content lives in three arrays at the top of the script in `src/app.html`: `OBJ` (objections), `LESSONS`, `MAP` (the translator), and `PERSONAS` (role-play prospects). Keep the same rules when adding content:

- Never say anything negative about EOS®, an Implementer, a prospect's coach or their do-it-yourself approach. Describe the difference instead.
- Write all content in original wording. Don't paste text from books or paid training material.
- Every claim about EOS® must trace to a public source. The current source is EOS Worldwide's Franchise Disclosure Document, as summarized on apogeeleadership.co.
- Never include pricing.
- Don't use "coaching", "consulting" or "implementing" to describe what guides do.
