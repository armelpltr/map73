from PIL import Image
import os, shutil

SRC = r"C:\Mes Sites Web\site\www.map73.fr\img"
DST = r"C:\Mes Sites Web\site\map73\assets\img"
os.makedirs(DST, exist_ok=True)

# (fichier source, base de sortie, largeurs cibles)
JOBS = [
    ("article-map73-chambery-orientation-scolaire.jpg", "presse-hebdo-savoie", [480, 960]),
    ("logo-le-petit-reporter.jpg", "presse-petit-reporter", [480, 960]),
    ("rediff-place-aux-possibles.jpg", "presse-place-aux-possibles", [480, 960]),
    ("adie-map73.jpg", "presse-adie", [480, 960]),
    ("bureaux-map73.jpg", "bureaux-map73", [640, 1280]),
    ("preview.jpg", "og-preview", [1200]),
]

for src, base, widths in JOBS:
    p = os.path.join(SRC, src)
    im = Image.open(p).convert("RGB")
    for w in widths:
        if im.width < w:
            w = im.width
        h = round(im.height * w / im.width)
        out = im.resize((w, h), Image.LANCZOS)
        name = f"{base}-{w}.webp"
        out.save(os.path.join(DST, name), "WEBP", quality=78, method=6)
        print(name, out.size, os.path.getsize(os.path.join(DST, name)) // 1024, "Ko")

# logo : PNG a fond transparent -> webp avec alpha, 2 densites
logo = Image.open(os.path.join(SRC, "logo.png")).convert("RGBA")
print("logo original", logo.size)
for w in [220, 440]:
    h = round(logo.height * w / logo.width)
    logo.resize((w, h), Image.LANCZOS).save(os.path.join(DST, f"logo-{w}.webp"), "WEBP", quality=88, method=6)
    print(f"logo-{w}.webp", os.path.getsize(os.path.join(DST, f"logo-{w}.webp")) // 1024, "Ko")

# favicons a partir du logo
ico = Image.open(os.path.join(SRC, "favicon.ico")).convert("RGBA")
print("favicon original", ico.size)
ico.resize((180, 180), Image.LANCZOS).save(os.path.join(DST, "apple-touch-icon.png"), "PNG", optimize=True)
ico.save(os.path.join(r"C:\Mes Sites Web\site\map73", "favicon.ico"), sizes=[(16,16),(32,32),(48,48)])
print("favicon.ico", os.path.getsize(os.path.join(r"C:\Mes Sites Web\site\map73", "favicon.ico")) // 1024, "Ko")

# documents PDF
for f in os.listdir(r"C:\Mes Sites Web\site\www.map73.fr\docs"):
    shutil.copy(os.path.join(r"C:\Mes Sites Web\site\www.map73.fr\docs", f),
                os.path.join(r"C:\Mes Sites Web\site\map73\assets\docs", f.replace(" ", "-").replace("MAP73---", "map73-").lower()))
print(os.listdir(r"C:\Mes Sites Web\site\map73\assets\docs"))
