// ============================================================
// UI — petites aides partagées par les panneaux du panel
// ============================================================

export const $ = (id) => document.getElementById(id);

/** Crée un élément avec classe, texte et attributs optionnels. */
export function el(balise, options = {}) {
  const noeud = document.createElement(balise);
  if (options.classe) noeud.className = options.classe;
  if (options.texte !== undefined) noeud.textContent = options.texte;
  if (options.attributs) {
    for (const [nom, valeur] of Object.entries(options.attributs)) {
      if (valeur !== null && valeur !== undefined) noeud.setAttribute(nom, valeur);
    }
  }
  if (options.enfants) noeud.append(...options.enfants);
  return noeud;
}

/** Affiche l'état de la barre d'enregistrement. `ton` : succes, erreur, ou vide. */
export function etat(message, ton = "") {
  const zone = $("barre-etat");
  if (!zone) return;
  zone.textContent = message;
  if (ton) {
    zone.dataset.ton = ton;
  } else {
    delete zone.dataset.ton;
  }
}

/** Champ de saisie étiqueté. `type` : texte, zone, case. */
export function champ({ label, valeur, indice, type = "texte", large = false, options, onChange }) {
  const id = `champ-${Math.random().toString(36).slice(2, 9)}`;

  if (type === "case") {
    const entree = el("input", { attributs: { type: "checkbox", id } });
    entree.checked = Boolean(valeur);
    entree.addEventListener("change", () => onChange(entree.checked));
    return el("label", {
      classe: "case-a-cocher" + (large ? " champ--large" : ""),
      enfants: [entree, el("span", { texte: label })]
    });
  }

  /* Choix ferme : le site ne connait qu'une liste de valeurs (les glyphes de
     la legende, par exemple), une saisie libre n'y aurait aucun sens. */
  if (type === "choix") {
    const liste = el("select", { attributs: { id } });
    for (const option of options || []) {
      liste.appendChild(el("option", { texte: option.libelle, attributs: { value: option.valeur } }));
    }
    liste.value = valeur ?? (options?.[0]?.valeur ?? "");
    liste.addEventListener("change", () => onChange(liste.value));

    const enfantsChoix = [el("label", { texte: label, attributs: { for: id } }), liste];
    if (indice) enfantsChoix.push(el("span", { classe: "champ__indice", texte: indice }));
    return el("div", { classe: "champ" + (large ? " champ--large" : ""), enfants: enfantsChoix });
  }

  const entree = type === "zone" ? el("textarea", { attributs: { id } }) : el("input", { attributs: { type: "text", id } });
  entree.value = valeur ?? "";
  entree.addEventListener("input", () => onChange(entree.value));

  const enfants = [el("label", { texte: label, attributs: { for: id } }), entree];
  if (indice) enfants.push(el("span", { classe: "champ__indice", texte: indice }));

  return el("div", { classe: "champ" + (large ? " champ--large" : ""), enfants });
}

/**
 * Liste de textes courts, avec ajout et suppression.
 * `lire` renvoie le tableau courant, `ecrire` le remplace.
 */
export function sousListe({ label, valeurs, indice, onChange }) {
  const lignes = el("div", { classe: "sous-liste" });
  const courant = Array.isArray(valeurs) ? [...valeurs] : [];

  const redessiner = () => {
    lignes.textContent = "";

    courant.forEach((valeur, index) => {
      const entree = el("input", { attributs: { type: "text" } });
      entree.value = valeur ?? "";
      entree.addEventListener("input", () => {
        courant[index] = entree.value;
        onChange([...courant]);
      });

      const retirer = el("button", {
        classe: "icone-bouton icone-bouton--danger",
        texte: "×",
        attributs: { type: "button", title: "Supprimer cette ligne" }
      });
      retirer.addEventListener("click", () => {
        courant.splice(index, 1);
        onChange([...courant]);
        redessiner();
      });

      lignes.appendChild(el("div", { classe: "sous-liste__ligne", enfants: [entree, retirer] }));
    });

    const ajouter = el("button", {
      classe: "bouton bouton--discret",
      texte: "Ajouter une ligne",
      attributs: { type: "button" }
    });
    ajouter.addEventListener("click", () => {
      courant.push("");
      onChange([...courant]);
      redessiner();
    });
    lignes.appendChild(ajouter);
  };

  redessiner();

  const enfants = [el("label", { texte: label })];
  if (indice) enfants.push(el("span", { classe: "champ__indice", texte: indice }));
  enfants.push(lignes);

  return el("div", { classe: "champ champ--large", enfants });
}

/**
 * Liste de lignes à deux colonnes : chaque entrée est un objet à deux clés.
 * Sert aux repères chiffrés et aux faits des fondatrices, où le libellé et
 * la valeur vont toujours par paire et n'auraient aucun sens séparés.
 */
export function sousListePaires({ label, valeurs, indice, cles, libelleAjout = "Ajouter une ligne", onChange }) {
  const lignes = el("div", { classe: "sous-liste" });
  const courant = Array.isArray(valeurs) ? valeurs.map((v) => ({ ...v })) : [];

  const remonter = () => onChange(courant.map((v) => ({ ...v })));

  const redessiner = () => {
    lignes.textContent = "";

    courant.forEach((entree, index) => {
      const saisies = cles.map(({ cle, placeholder }) => {
        const champTexte = el("input", { attributs: { type: "text", placeholder: placeholder || "" } });
        champTexte.value = entree[cle] ?? "";
        champTexte.addEventListener("input", () => {
          entree[cle] = champTexte.value;
          remonter();
        });
        return champTexte;
      });

      const retirer = el("button", {
        classe: "icone-bouton icone-bouton--danger",
        texte: "×",
        attributs: { type: "button", title: "Supprimer cette ligne" }
      });
      retirer.addEventListener("click", () => {
        courant.splice(index, 1);
        remonter();
        redessiner();
      });

      lignes.appendChild(el("div", { classe: "sous-liste__ligne sous-liste__ligne--paire", enfants: [...saisies, retirer] }));
    });

    const ajouter = el("button", {
      classe: "bouton bouton--discret",
      texte: libelleAjout,
      attributs: { type: "button" }
    });
    ajouter.addEventListener("click", () => {
      courant.push(Object.fromEntries(cles.map(({ cle }) => [cle, ""])));
      remonter();
      redessiner();
    });
    lignes.appendChild(ajouter);
  };

  redessiner();

  const enfants = [el("label", { texte: label })];
  if (indice) enfants.push(el("span", { classe: "champ__indice", texte: indice }));
  enfants.push(lignes);

  return el("div", { classe: "champ champ--large", enfants });
}

/** Confirmation avant une suppression. */
export function confirmer(message) {
  return window.confirm(message);
}
