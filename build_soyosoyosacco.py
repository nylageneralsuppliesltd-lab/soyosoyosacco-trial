import os, re, zipfile, textwrap, shutil

# === CONFIG ===
PROJECT = "SoyosoyosAccoWebsite"
OUT_DIR = PROJECT
SCRIPT_DIR = os.path.join(OUT_DIR, "scripts")
ASSET_DIR = os.path.join(OUT_DIR, "assets")
STYLE_PATH = os.path.join(OUT_DIR, "style.css")

# Clean up any old build
if os.path.exists(OUT_DIR):
    shutil.rmtree(OUT_DIR)
os.makedirs(SCRIPT_DIR, exist_ok=True)
os.makedirs(ASSET_DIR, exist_ok=True)

# Patterns
style_pattern = re.compile(r"<style[^>]*>(.*?)</style>", re.S | re.I)
script_pattern = re.compile(r"<script[^>]*>(.*?)</script>", re.S | re.I)
img_pattern = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)

# Collectors
all_styles = []
chatbot_js, calculator_js, main_js = [], [], []

def beautify_js(code: str) -> str:
    """Add spacing and indentation for readability."""
    code = re.sub(r";(?!\s*\n)", ";\n", code)
    code = re.sub(r"}(?!\s*\n)", "}\n", code)
    return code.strip()

def copy_asset(path: str):
    """Copy referenced asset into the assets folder."""
    if not os.path.exists(path):
        return None
    fname = os.path.basename(path)
    dest = os.path.join(ASSET_DIR, fname)
    try:
        shutil.copy2(path, dest)
        return "assets/" + fname
    except Exception:
        return None

# Process each .html file in the current directory
for fname in os.listdir("."):
    if not fname.lower().endswith(".html"):
        continue

    with open(fname, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()

    # Extract styles
    styles = style_pattern.findall(html)
    all_styles.extend(styles)

    # Extract scripts and categorize
    scripts = script_pattern.findall(html)
    for s in scripts:
        lower = s.lower()
        if "chat" in lower:
            chatbot_js.append(beautify_js(s))
        elif "dividend" in lower or "loan" in lower:
            calculator_js.append(beautify_js(s))
        else:
            main_js.append(beautify_js(s))

    # Copy all images referenced
    for img_src in img_pattern.findall(html):
        # ignore remote URLs
        if img_src.startswith("http") or img_src.startswith("data:"):
            continue
        new_src = copy_asset(img_src)
        if new_src:
            html = html.replace(img_src, new_src)

    # Replace inline style/script with links
    html = style_pattern.sub('<link rel="stylesheet" href="style.css">', html)
    html = script_pattern.sub("", html)

    # Inject external script references
    inserts = [
        '<script src="scripts/chatbot.js"></script>',
        '<script src="scripts/calculator.js"></script>',
        '<script src="scripts/main.js"></script>'
    ]
    html = re.sub(r"</body>", "\n".join(inserts) + "\n</body>", html, flags=re.I)

    # Save cleaned HTML to output directory
    with open(os.path.join(OUT_DIR, fname), "w", encoding="utf-8") as f:
        f.write(textwrap.dedent(html).strip())

# Write merged CSS and JS
with open(STYLE_PATH, "w", encoding="utf-8") as f:
    for s in all_styles:
        f.write(s.strip() + "\n\n")

with open(os.path.join(SCRIPT_DIR, "chatbot.js"), "w", encoding="utf-8") as f:
    f.write("\n\n".join(chatbot_js))

with open(os.path.join(SCRIPT_DIR, "calculator.js"), "w", encoding="utf-8") as f:
    f.write("\n\n".join(calculator_js))

with open(os.path.join(SCRIPT_DIR, "main.js"), "w", encoding="utf-8") as f:
    f.write("\n\n".join(main_js))

# Zip everything
zipname = f"{PROJECT}.zip"
with zipfile.ZipFile(zipname, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(OUT_DIR):
        for file in files:
            path = os.path.join(root, file)
            z.write(path, os.path.relpath(path, start=OUT_DIR))

print("✅ Build complete!")
print(f"→ Folder: {OUT_DIR}/")
print(f"→ ZIP: {zipname}")
print("Pages included:", [f for f in os.listdir(OUT_DIR) if f.endswith('.html')])
