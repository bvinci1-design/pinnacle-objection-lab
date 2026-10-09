# Pinnacle Objection Lab

Practice tool for Certified Pinnacle Business Guides. Read `README.md` for how it's built and
deployed. To act on guide feedback, follow `.claude/skills/objection-lab-feedback/SKILL.md`.

- Edit `src/`, never the built `index.html` / `objection-lab.html`. Rebuild with `python3 build.py`.
- Test with `sh tests/run.sh` before every ship.
- Secrets live in the Worker (`wrangler secret`), never in this repo, which is public.
