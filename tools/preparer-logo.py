# -*- coding: utf-8 -*-
"""
Prépare le logo du site à partir du fichier fourni par le client.

Le logo est livré en JPEG, texte blanc sur fond noir. L'en-tête du site est
clair : on ne peut ni poser le rectangle noir, ni détourer le blanc, qui
deviendrait invisible. On extrait donc les formes et on les recolore en deux
tons — l'encre du site pour le lettrage, le vert du logo pour la flèche et le
trait — sur fond transparent.

Le JPEG d'origine est conservé dans assets/img/logo-source.jpg : tant que le
fichier vectoriel n'est pas fourni, c'est la seule source.

    python tools/preparer-logo.py
"""

from PIL import Image
import numpy as np
import os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, "assets", "img", "logo-source.jpg")
DEST = os.path.join(RACINE, "assets", "img")

ENCRE = (20, 36, 59)        # --ink du site
SEUIL_FOND = 28             # en dessous, c'est le fond noir du JPEG
LARGEURS = [240, 480]


def deux_tons(zone, couleur_texte):
    """Renvoie une image RGBA : formes recolorées, fond transparent."""
    a = np.asarray(zone.convert("RGB")).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = a.max(axis=2)

    # L'opacité suit la luminosité : les bords adoucis du JPEG le restent.
    # En int32 : le produit intermédiaire dépasse largement un int16.
    alpha = np.clip((lum - SEUIL_FOND) * 255 // (255 - SEUIL_FOND), 0, 255)

    vert = (g > r * 1.25) & (g > b * 1.25) & (lum > 60)
    vert_marque = np.median(a[vert], axis=0).astype(np.int32) if vert.any() else np.array(couleur_texte)

    sortie = np.zeros(a.shape[:2] + (4,), dtype=np.uint8)
    sortie[..., 0] = np.where(vert, vert_marque[0], couleur_texte[0])
    sortie[..., 1] = np.where(vert, vert_marque[1], couleur_texte[1])
    sortie[..., 2] = np.where(vert, vert_marque[2], couleur_texte[2])
    sortie[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(sortie, "RGBA"), tuple(int(v) for v in vert_marque)


def boite_contenu(im):
    a = np.asarray(im.convert("RGB")).astype(np.int16).max(axis=2)
    ys, xs = np.where(a > SEUIL_FOND)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def bandes(im, boite):
    """Découpe le lockup en bandes horizontales séparées par du vide."""
    gauche, haut, droite, bas = boite
    a = np.asarray(im.convert("RGB")).astype(np.int16).max(axis=2)[haut:bas, gauche:droite]
    remplies = (a > SEUIL_FOND).sum(axis=1) > 0

    trouvees, debut = [], None
    for i, pleine in enumerate(remplies):
        if pleine and debut is None:
            debut = i
        elif not pleine and debut is not None:
            trouvees.append((haut + debut, haut + i))
            debut = None
    if debut is not None:
        trouvees.append((haut + debut, bas))
    return trouvees


def main():
    im = Image.open(SOURCE)
    boite = boite_contenu(im)
    lockup = im.crop(boite)
    print("source %s -> contenu %s" % (im.size, lockup.size))

    rendu, vert = deux_tons(lockup, ENCRE)
    print("vert de la marque : #%02X%02X%02X" % vert)

    for largeur in LARGEURS:
        hauteur = round(rendu.height * largeur / rendu.width)
        chemin = os.path.join(DEST, "logo-%d.webp" % largeur)
        rendu.resize((largeur, hauteur), Image.LANCZOS).save(chemin, "WEBP", quality=90, method=6)
        print("logo-%d.webp  %dx%d  %d Ko" % (largeur, largeur, hauteur, os.path.getsize(chemin) // 1024))

    # Favicon : le mot MAP seul, la signature complète serait illisible à 32 px.
    lignes = bandes(im, boite)
    print("bandes detectees :", lignes)
    gauche, _, droite, _ = boite
    haut_map, bas_map = lignes[0]
    marque = deux_tons(im.crop((gauche, haut_map, droite, bas_map)), ENCRE)[0]

    cote = max(marque.size)
    marge = round(cote * 0.12)
    carre = Image.new("RGBA", (cote + 2 * marge, cote + 2 * marge), (0, 0, 0, 0))
    carre.paste(marque, ((carre.width - marque.width) // 2, (carre.height - marque.height) // 2), marque)

    carre.resize((180, 180), Image.LANCZOS).save(os.path.join(DEST, "apple-touch-icon.png"), "PNG", optimize=True)
    carre.resize((64, 64), Image.LANCZOS).save(
        os.path.join(RACINE, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("favicon.ico et apple-touch-icon.png regeneres")


if __name__ == "__main__":
    main()
