"""Build the two outputs from src/app.html: the Artifact page and a standalone index.html."""
import base64, pathlib
root = pathlib.Path(__file__).parent
src = (root / "src/app.html").read_text()
logo = "data:image/png;base64," + base64.b64encode((root / "assets/pinnacle-logo.png").read_bytes()).decode()
page = src.replace("__LOGO__", logo)
(root / "objection-lab.html").write_text(page)
(root / "index.html").write_text(
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    '</head>\n<body>\n' + page + '\n</body>\n</html>\n')
print("built", len(page), "bytes")
