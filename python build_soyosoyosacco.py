import os, re, zipfile, shutil, textwrap

# === CONFIG ===
PROJECT = "SoyosoyosAccoWebsite"
SRC_FILE = "Home.html"   # your uploaded file
OUT_DIR = PROJECT
SCRIPT_DIR = os.path.join(OUT_DIR, "scripts")

# --- prepare folders ---
for d in [OUT_DIR, SCRIPT_DIR]:
    os.makedirs(d, exist_ok=True)

with open(SRC_FILE, "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

# --- extract <style> and <script> blocks ---
styles = re.findall(r"<style[^>]*>(.*?)</style>", html, re.S)
scripts = re.findall(r"<script[^>]*>(.*?)</script>", html, re.S)

# save CSS
if styles:
    with open(os.path.join(OUT_DIR, "style.css"), "w", encoding="utf-8") as f:
        for s in styles:
            f.write(s.strip() + "\n\n")
    html = re.sub(r"<style[^>]*>.*?</style>", 
                  '<link rel="stylesheet" href="style.css">', html, flags=re.S)

# save JS (simple distribution by keyword)
for i, s in enumerate(scripts, 1):
    target = "main.js"
    lower = s.lower()
    if "dividend" in lower:
        target = "calculator.js"
    elif "chat" in lower:
        target = "chatbot.js"

    # beautify a bit: add line breaks after ; or }
    code = re.sub(r";(?!\s*\n)", ";\n", s)
    code = re.sub(r"}(?!\s*\n)", "}\n", code)

    outpath = os.path.join(SCRIPT_DIR, target)
    with open(outpath, "a", encoding="utf-8") as f:
        f.write(code.strip() + "\n\n")

# replace inline scripts in HTML with links (in rough order)
html_clean = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.S)
inserts = [
    '<script src="scripts/calculator.js"></script>',
    '<script src="scripts/chatbot.js"></script>',
    '<script src="scripts/main.js"></script>'
]
html_clean = re.sub(r"</body>", "\n".join(inserts) + "\n</body>", html_clean, flags=re.I)

# --- save new index.html ---
with open(os.path.join(OUT_DIR, "index.html"), "w", encoding="utf-8") as f:
    f.write(textwrap.dedent(html_clean).strip())

# --- make ZIP ---
zipname = f"{PROJECT}.zip"
with zipfile.ZipFile(zipname, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(OUT_DIR):
        for file in files:
            path = os.path.join(root, file)
            z.write(path, os.path.relpath(path, start=OUT_DIR))

print(f"✅ Project built and zipped: {zipname}")
print(f"Folder structure:\n  {OUT_DIR}/\n    ├── index.html\n    ├── style.css\n    └── scripts/...")

