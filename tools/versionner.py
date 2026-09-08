# -*- coding: utf-8 -*-
"""
Estampille une version sur toutes les URL de modules JavaScript.

GitHub Pages sert les fichiers avec `Cache-Control: max-age=600`. Un
rechargement forcé rafraîchit la page et le module d'entrée, mais pas
toujours les modules que celui-ci importe : le navigateur peut exécuter un
mélange d'ancien et de nouveau code pendant dix minutes. Pendant la mise au
point de la connexion, cela a coûté plusieurs allers-retours à chercher des
bogues déjà corrigés.

Chaque URL de module porte donc `?v=<horodatage>`, identique partout et
changé à chaque publication : une version différente est une URL différente,
donc un fichier que le navigateur va rechercher.

    python tools/versionner.py

À lancer avant chaque commit qui touche au JavaScript.
"""

import io
import os
import re
from datetime import datetime

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Fichiers a estampiller : les pages qui chargent un module, et les modules
# qui en importent d'autres.
CIBLES = [
    "index.html",
    "mentions-legales.html",
    "admin/index.html",
    "assets/js/site-data.js",
    "assets/js/admin/app.js",
    "assets/js/admin/auth.js",
    "assets/js/admin/acces.js",
    "assets/js/admin/panneaux.js",
]

# `src="..."` dans le HTML, et les specificateurs d'import relatifs dans le JS.
MOTIFS = [
    re.compile(r'(src=")([^"]+?\.js)(\?v=[0-9-]+)?(")'),
    re.compile(r'(from ")(\.{1,2}/[^"]+?\.js)(\?v=[0-9-]+)?(")'),
    re.compile(r'(import\(")(\.{1,2}/[^"]+?\.js)(\?v=[0-9-]+)?(")'),
]


def estampiller(version):
    modifies = []

    for cible in CIBLES:
        chemin = os.path.join(RACINE, cible)
        avant = io.open(chemin, encoding="utf-8").read()
        apres = avant

        for motif in MOTIFS:
            apres = motif.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={version}{m.group(4)}", apres)

        if apres != avant:
            io.open(chemin, "w", encoding="utf-8").write(apres)
            modifies.append(cible)

    return modifies


def main():
    version = datetime.now().strftime("%Y%m%d-%H%M")
    modifies = estampiller(version)

    print(f"version {version}")
    for cible in modifies:
        print("  estampille :", cible)
    if not modifies:
        print("  rien a changer")


if __name__ == "__main__":
    main()
