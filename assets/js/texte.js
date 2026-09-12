// ============================================================
// TEXTE — pose du texte venu de Firestore dans le DOM, sans innerHTML
//
// Le contenu est saisi dans le panel puis affiché sur le site public : il
// ne doit jamais pouvoir devenir du code. Tout passe donc par textContent,
// à deux exceptions près : <sup>, indispensable pour écrire 3ᵉ, 2ᵈᵉ, 1ʳᵉ
// correctement, et <strong>, pour mettre une phrase en avant dans un
// paragraphe. Ces exceptions sont traitées par un analyseur maison qui ne
// reconnaît que ces deux balises et pose le reste en texte brut.
// ============================================================

const BALISES = /<(sup|strong)>(.*?)<\/\1>/gi;

/** Vide `el` puis y écrit `texte`, en ne rendant que <sup> et <strong>. */
export function poserTexte(el, texte) {
  if (!el || texte === undefined || texte === null) return;
  el.textContent = "";

  let position = 0;
  let m;
  BALISES.lastIndex = 0;

  while ((m = BALISES.exec(texte)) !== null) {
    if (m.index > position) {
      el.appendChild(document.createTextNode(texte.slice(position, m.index)));
    }
    const balise = document.createElement(m[1].toLowerCase());
    balise.textContent = m[2];
    el.appendChild(balise);
    position = m.index + m[0].length;
  }

  if (position < texte.length) {
    el.appendChild(document.createTextNode(texte.slice(position)));
  }
}

/** Crée un élément, avec un texte optionnel posé par poserTexte. */
export function creer(balise, classe, texte) {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  if (texte !== undefined) poserTexte(el, texte);
  return el;
}

/**
 * N'accepte qu'une URL réellement navigable. Une adresse saisie dans le
 * panel finit dans un href : `javascript:` y ouvrirait l'exécution de code
 * sur le site public.
 */
export function lienSur(url) {
  if (typeof url !== "string") return "";
  const valeur = url.trim();
  if (!valeur) return "";
  if (valeur.startsWith("#") || valeur.startsWith("/") || valeur.startsWith("assets/")) return valeur;
  try {
    const parsee = new URL(valeur, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsee.protocol) ? valeur : "";
  } catch {
    return "";
  }
}

/** Retire toute balise d'un texte : utilisé pour les attributs (alt, title). */
export function sansBalises(texte) {
  return typeof texte === "string" ? texte.replace(/<[^>]*>/g, "") : "";
}

/** Trie une liste d'entrées sur leur champ `ordre`, les absents en dernier. */
export function parOrdre(liste) {
  return [...liste].sort((a, b) => (a.ordre ?? 9999) - (b.ordre ?? 9999));
}
