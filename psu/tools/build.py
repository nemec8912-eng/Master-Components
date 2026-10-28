"""Собирает страницу в один HTML-файл (все css/js встроены).
Использование: python3 tools/build.py index.html dist/samsung.html"""
import re, sys, os
src, out = sys.argv[1], sys.argv[2]
base = os.path.dirname(os.path.abspath(src))
html = open(src, encoding="utf-8").read()
def css(m):
    return "<style>\n" + open(os.path.join(base, m.group(1)), encoding="utf-8").read() + "</style>"
def js(m):
    return "<script>\n" + open(os.path.join(base, m.group(1)), encoding="utf-8").read() + "</script>"
html = re.sub(r'<link rel="stylesheet" href="((?!https?:)[^"]+)">', css, html)
html = re.sub(r'<script src="((?!https?:)[^"]+)"></script>', js, html)
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
open(out, "w", encoding="utf-8").write(html)
print(out, len(html))
