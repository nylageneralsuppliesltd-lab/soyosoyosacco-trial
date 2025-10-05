import os, re, zipfile, textwrap, shutil

PROJECT = "SoyosoyosAccoWebsite"
OUT_DIR = PROJECT
SCRIPT_DIR = os.path.join(OUT_DIR, "scripts")
STYLE_PATH = os.path.join(OUT_DIR, "style.css")

# clean previous builds
if os.path.exists(OUT_DIR):
    shutil.rmtree(OUT_DIR)
os.makedirs(SCRIPT_DIR, exist_ok=True)

# patterns
style_pattern = re.compile(r"<style[^>]*>(.*?)</style>", re.S | re.I)
script_pattern = re.compile(r"<script[^>]*>(.*?)</script>", re.S | re.I)

# collectors
all_styles = []
chatbot_js, calculator_js, main_js = [], [], []

def beautify_js(code: str) -> str:
    code = re.sub(r";(?!\s*\n)", ";\n", code)
    code = re.sub(r"}(?!\s*\n)", "}\n", code)
    return code.strip()

# process every .html file in the current folder
for fname in os.listdir("."):
    if not fname.lower().endswith(".html"):
        continue

    with open(fname, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()

    # extract styles
    styles = style_pattern.findall(html)
    all_styles.extend(styles)

    # extract scripts and categorize
    scripts = script_pattern.findall(html)
    for s in scripts:
        lower = s.lower()
        if "chat" in lower:
            chatbot_js.append(beautify_js(s))
        elif "dividend" in lower or "loan" in lower:
            calculator_js.append(beautify_js(s))
        else:
            main_js.append(beautify_js(s))

    # remove inline style/script and inject references
    html = style_pattern.sub('<link rel="stylesheet" href="style.css">', html)
    html = script_pattern.sub("", html)
    inserts = [
        '<script src="scripts/chatbot.js"></script>',
        '<script src="scripts/calculator.js"></script>',
        '<script src="scripts/main.js"></script>'
    ]
    html = re.sub(r"</body>", "\n".join(inserts) + "\n</body>", html, flags=re.I)

    # save cleaned page to output folder
    with open(os.path.join(OUT_DIR, fname), "w", encoding="utf-8") as f:
        f.write(textwrap.dedent(html).strip())

# write merged CSS and JS files
with open(STYLE_PATH, "w", encoding="utf-8") as f:
    for s in all_styles:
        f.write(s.strip() + "\n\n")

with open(os.path.join(SCRIPT_DIR, "chatbot.js"), "w", encoding="utf-8") as f:
    f.write("\n\n".join(chatbot_js))

with open(os.path.join(SCRIPT_DIR, "calculator.js"), "w", encoding="utf-8") as f:
    f.write("\n\n".join(calculator_js))

with open(os.path.join(SCRIPT_DIR, "main.js"), "w", encoding="utf-8") as f:
    f.write("\n\n".join(main_js))

# make zip
zipname = f"{PROJECT}.zip"
with zipfile.ZipFile(zipname, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(OUT_DIR):
        for file in files:
            path = os.path.join(root, file)
            z.write(path, os.path.relpath(path, start=OUT_DIR))

print(f"✅ All pages processed and zipped: {zipname}")
print(f"Website folder: {OUT_DIR}/")
print(f"Pages included: {[f for f in os.listdir(OUT_DIR) if f.endswith('.html')]}")
