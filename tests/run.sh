#!/bin/sh
# Runs every test: the Worker against fake storage, then each UI suite in headless Chromium.
# Usage: sh tests/run.sh   (from the Objection Lab folder, after `python3 build.py`)
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=${TMPDIR:-/tmp}/objection-lab-tests; mkdir -p "$OUT"
CHROME=${CHROME:-$(ls -d "$HOME"/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell 2>/dev/null | tail -1)}
[ -x "$CHROME" ] || { echo "Set CHROME to a headless Chromium binary"; exit 1; }
FAIL=0

echo "== worker"
(cd "$ROOT/worker" && npx wrangler deploy --dry-run --outdir "$OUT/worker" >/dev/null 2>&1)
node "$ROOT/tests/worker.test.mjs" "$OUT/worker/index.js" 2>/dev/null | grep -E "^(PASS|FAIL)" | tee "$OUT/worker.txt"
grep -q "^FAIL" "$OUT/worker.txt" && FAIL=1

for suite in ui-core ui-roleplay ui-feedback ui-voice; do
  for width in 1200 390; do
    python3 -I - "$ROOT" "$suite" "$OUT/$suite.html" <<'PY'
import sys
root, suite, out = sys.argv[1:4]
html = open(root + "/index.html").read()
if suite == "ui-voice":
    html = html.replace("<body>\n", "<body>\n" + open(root + "/tests/mic-mock.js").read(), 1)
html = html.replace("</body>", open(root + "/tests/" + suite + ".js").read() + "</body>")
open(out, "w").write(html)
PY
    RES=$("$CHROME" --headless --disable-gpu --window-size=$width,900 --virtual-time-budget=40000 --dump-dom "file://$OUT/$suite.html" 2>/dev/null \
      | python3 -I -c "import sys,re,html;m=re.search(r'<pre id=\"TEST\">(.*?)</pre>',sys.stdin.read(),re.S);r=html.unescape(m.group(1)) if m else 'FAIL no result';print(r)")
    if echo "$RES" | grep -qE "^(FAIL|ERROR)"; then echo "== $suite @$width"; echo "$RES" | grep -E "^(FAIL|ERROR)"; FAIL=1
    else echo "== $suite @$width: $(echo "$RES" | grep -c '^PASS') pass"; fi
  done
done
exit $FAIL
