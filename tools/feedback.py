"""Read and triage guide feedback stored by the Worker in D1 (objection-lab-feedback).

    python3 tools/feedback.py                 digest of new feedback
    python3 tools/feedback.py --all           include resolved items
    python3 tools/feedback.py show 12         one item in full, transcript included
    python3 tools/feedback.py resolve 12,14 done "Rewrote the Ask step on the cost card"
    python3 tools/feedback.py resolve 15 wontfix "Duplicate of 12"

Runs `wrangler d1 execute --remote` from worker/, so it uses the wrangler login on this machine.
"""
import json, pathlib, subprocess, sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = "objection-lab-feedback"


def query(sql):
    out = subprocess.run(
        ["npx", "wrangler", "d1", "execute", DB, "--remote", "--json", "--command", sql],
        cwd=ROOT / "worker", capture_output=True, text=True,
    )
    if out.returncode != 0:
        sys.exit("wrangler failed:\n" + (out.stderr or out.stdout)[-2000:])
    data = json.loads(out.stdout)
    return data[0].get("results", []) if data else []


def sql_text(s):
    return "'" + str(s).replace("'", "''") + "'"


def parse_ids(arg):
    try:
        ids = [int(x) for x in arg.split(",") if x.strip()]
    except ValueError:
        sys.exit("IDs must be numbers, e.g. 12 or 12,14")
    if not ids:
        sys.exit("No IDs given")
    return ids


def digest(include_resolved):
    where = "" if include_resolved else "WHERE status = 'new'"
    rows = query(f"SELECT id, created_at, kind, target, helpful, rating_realism, rating_feedback, name, message, "
                 f"transcript IS NOT NULL AS has_transcript, page_version, status FROM feedback {where} ORDER BY id")
    if not rows:
        print("No new feedback." if not include_resolved else "No feedback yet.")
        return
    print(f"{len(rows)} item(s){'' if include_resolved else ' marked new'}\n")

    cards = defaultdict(lambda: [0, 0])
    real, useful = [], []
    for r in rows:
        if r["kind"] == "card" and r["helpful"] is not None:
            cards[r["target"]][0 if r["helpful"] else 1] += 1
        if r["rating_realism"]:
            real.append(r["rating_realism"])
        if r["rating_feedback"]:
            useful.append(r["rating_feedback"])
    if cards:
        print("Cards (helpful / needs work):")
        for target, (yes, no) in sorted(cards.items(), key=lambda kv: -kv[1][1]):
            print(f"  {target:24} {yes:>3} / {no}")
        print()
    if real or useful:
        avg = lambda xs: f"{sum(xs) / len(xs):.1f} from {len(xs)}" if xs else "none"
        print(f"Role-play: prospect realism {avg(real)}, feedback usefulness {avg(useful)}\n")

    print("Items:")
    for r in rows:
        bits = [f"#{r['id']}", r["created_at"][:16].replace("T", " "), r["kind"]]
        if r["target"]:
            bits.append(r["target"])
        if r["helpful"] is not None:
            bits.append("helpful" if r["helpful"] else "needs work")
        if r["rating_realism"] or r["rating_feedback"]:
            bits.append(f"realism {r['rating_realism'] or '-'}/5, feedback {r['rating_feedback'] or '-'}/5")
        if r["name"]:
            bits.append("from " + r["name"])
        if r["has_transcript"]:
            bits.append("transcript")
        if include_resolved:
            bits.append(r["status"])
        print("  " + " | ".join(bits))
        if r["message"]:
            print("      " + r["message"].replace("\n", "\n      "))


def show(item_id):
    rows = query(f"SELECT * FROM feedback WHERE id = {int(item_id)}")
    if not rows:
        sys.exit(f"No feedback #{item_id}")
    for k, v in rows[0].items():
        if v is None:
            continue
        if k == "transcript":
            print("transcript:\n" + v)
        else:
            print(f"{k}: {v}")


def resolve(ids, status, note):
    if status not in ("done", "wontfix"):
        sys.exit("Status must be done or wontfix")
    id_list = ",".join(str(i) for i in ids)
    query(f"UPDATE feedback SET status = {sql_text(status)}, resolution = {sql_text(note)}, "
          f"resolved_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id IN ({id_list})")
    print(f"Marked {id_list} as {status}.")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args == ["--all"]:
        digest("--all" in args)
    elif args[0] == "show" and len(args) == 2:
        show(parse_ids(args[1])[0])
    elif args[0] == "resolve" and len(args) == 4:
        resolve(parse_ids(args[1]), args[2], args[3])
    else:
        print(__doc__)
        sys.exit(1)
