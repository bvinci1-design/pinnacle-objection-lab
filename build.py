"""Build the two outputs from src/app.html.

objection-lab.html  the Claude Artifact page. Live role-play runs on the viewer's
                    own Claude account (artifact `sample` capability).
index.html          the standalone GitHub Pages site. Live role-play calls the
                    Cloudflare Worker in worker/ (passcode-gated).
"""
import base64, pathlib, re

ROLEPLAY_URL = "https://pinnacle-roleplay.pinnacle-roleplay.workers.dev"

root = pathlib.Path(__file__).parent
src = (root / "src/app.html").read_text()
prompt_js = re.sub(r"^export ", "", (root / "src/roleplay-prompt.js").read_text(), flags=re.M)
logo = "data:image/png;base64," + base64.b64encode((root / "assets/pinnacle-logo.png").read_bytes()).decode()

page = src.replace("__LOGO__", logo).replace("/*__ROLEPLAY_PROMPT__*/", prompt_js)

(root / "objection-lab.html").write_text(page.replace("__ROLEPLAY_URL__", ""))
(root / "index.html").write_text(
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    '</head>\n<body>\n' + page.replace("__ROLEPLAY_URL__", ROLEPLAY_URL) + '\n</body>\n</html>\n')
print("built", len(page), "bytes")
