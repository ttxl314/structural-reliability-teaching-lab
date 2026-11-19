"""Inline src/ into a single-file HTML.
Usage: python tools/build.py
Output: dist/structural-reliability-lab.html
"""
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT_DIR = ROOT / "dist"
OUT = OUT_DIR / "structural-reliability-lab.html"
ROOT_OUT = ROOT / "structural-reliability-lab.html"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main() -> int:
    html = read(SRC / "index.html")

    # 1) CSS
    css = read(SRC / "styles.css")
    html, n_css = re.subn(
        r'<link\s+rel="stylesheet"\s+href="styles\.css"\s*/?>',
        lambda m: "<style>\n" + css + "\n</style>",
        html,
        count=1,
    )
    if n_css != 1:
        print("ERROR: styles.css link not found", file=sys.stderr)
        return 1

    # 2) JS (in the order declared by index.html)
    def inline_script(m: re.Match[str]) -> str:
        src = m.group(1)
        code = read(SRC / "js" / src)
        code = code.replace("</script>", "<\\/script>")
        return "<script>\n" + code + "\n</script>"

    html, n_js = re.subn(r'<script\s+src="js/([^"]+)"></script>', inline_script, html)
    if n_js < 8:
        print(f"ERROR: expected >=8 scripts, inlined {n_js}", file=sys.stderr)
        return 1

    # 3) Add the build marker
    marker = "<!-- Single-file build: src/index.html + styles.css + js/*.js; formula SVGs are inlined; no external requests. -->\n"
    html = html.replace("<!doctype html>", "<!doctype html>\n" + marker, 1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    shutil.copyfile(OUT, ROOT_OUT)

    # 4) Basic sanity check: no local src/href references should remain
    leftovers = re.findall(r'(?:src|href)="(?!data:|#)[^"]+"', html)
    leftovers = [x for x in leftovers if not x.startswith("http")]
    size_mb = OUT.stat().st_size / 1024 / 1024
    print(f"built {OUT}")
    print(f"copied {ROOT_OUT}")
    print(f"  size: {size_mb:.2f} MB ({OUT.stat().st_size:,} bytes)")
    print(f"  inlined: 1 css, {n_js} js")
    if leftovers:
        print(f"  WARNING: remaining external refs: {leftovers[:5]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
