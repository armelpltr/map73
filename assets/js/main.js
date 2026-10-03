/* MAP73 — interactions du site. Aucune dépendance. */
(() => {
  "use strict";

  /* ---- Menu mobile ---- */
  const bascule = document.getElementById("bascule-menu");
  const nav = document.getElementById("navigation");

  if (bascule && nav) {
    const fermer = () => {
      nav.removeAttribute("data-ouvert");
      bascule.setAttribute("aria-expanded", "false");
    };

    bascule.addEventListener("click", () => {
      const ouvert = nav.getAttribute("data-ouvert") === "oui";
      if (ouvert) {
        fermer();
      } else {
        nav.setAttribute("data-ouvert", "oui");
        bascule.setAttribute("aria-expanded", "true");
      }
    });

    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) fermer();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fermer();
    });
  }

  /* ---- Ombre et compactage de l'en-tête au défilement ----
     Une sentinelle d'un pixel en haut de page plutôt qu'un écouteur de
     défilement : le navigateur prévient quand elle sort du champ, on ne
     lui demande rien à chaque cran de molette. L'attribut data-defile
     porte à la fois l'ombre et la hauteur réduite, côté CSS. */
  const entete = document.getElementById("entete");
  if (entete) {
    const sentinelle = document.createElement("div");
    sentinelle.style.cssText = "position:absolute;top:0;height:1px;width:1px;";
    document.body.prepend(sentinelle);

    new IntersectionObserver(
      ([entree]) => {
        entete.dataset.defile = entree.isIntersecting ? "non" : "oui";
      },
      { threshold: 0 }
    ).observe(sentinelle);
  }

  /* ---- Le lien de la section lue ----
     Un filet vert glisse d'un intitulé à l'autre selon la section à
     l'écran. Deux partis pris :
     - les sections sont suivies par IntersectionObserver, pas par un
       calcul de position à chaque défilement ;
     - le filet est créé ici, pas dans le HTML : il est décoratif, et
       aucune des six pages n'a besoin d'être touchée pour l'accueillir.
     Sur le menu mobile, qui est une colonne, le CSS le masque. */
  if (nav) {
    const liensAncres = [...nav.querySelectorAll('.nav__lien[href^="#"]')];
    const sections = liensAncres
      .map((lien) => document.getElementById(lien.getAttribute("href").slice(1)))
      .filter(Boolean);

    if (sections.length) {
      const curseur = document.createElement("span");
      curseur.className = "nav__curseur";
      curseur.setAttribute("aria-hidden", "true");
      nav.append(curseur);

      const visibles = new Set();
      let actif = null;

      const placer = () => {
        if (!actif || getComputedStyle(curseur).display === "none") {
          curseur.style.opacity = "0";
          return;
        }
        const l = actif.getBoundingClientRect();
        const n = nav.getBoundingClientRect();
        curseur.style.opacity = "1";
        curseur.style.width = l.width + "px";
        // Le filet se pose sur la bordure basse du lien, celle que le
        // survol colore : les deux ne doivent pas se croiser de 2 px.
        curseur.style.top = l.bottom - n.top - 2 + "px";
        curseur.style.transform = "translateX(" + (l.left - n.left) + "px)";
      };

      const choisir = () => {
        // La section active est la première visible dans l'ordre du
        // document : en bas de page, plusieurs le sont à la fois.
        const section = sections.find((s) => visibles.has(s));
        const lien = section
          ? liensAncres.find((l) => l.getAttribute("href") === "#" + section.id)
          : null;

        if (lien === actif) return;
        for (const l of liensAncres) l.removeAttribute("aria-current");
        if (lien) lien.setAttribute("aria-current", "true");
        actif = lien;
        placer();
      };

      // La bande utile commence sous l'en-tête et s'arrête à mi-écran :
      // sans cela, la dernière section du bas resterait « active » dès
      // qu'elle affleure en bas de fenêtre.
      const oeilSections = new IntersectionObserver(
        (entrees) => {
          for (const entree of entrees) {
            if (entree.isIntersecting) visibles.add(entree.target);
            else visibles.delete(entree.target);
          }
          choisir();
        },
        { rootMargin: "-88px 0px -55% 0px", threshold: 0 }
      );
      for (const section of sections) oeilSections.observe(section);

      // L'en-tête change de hauteur au défilement : le filet doit suivre.
      new ResizeObserver(placer).observe(entete || document.body);
      window.addEventListener("resize", placer, { passive: true });
    }
  }

  /* ---- Presse : le ruban qui defile ----
     La grille du HTML est transformee en piste horizontale, doublee, et
     animee par le CSS. Trois points de vigilance :
     - la copie est marquee aria-hidden et ses liens sortent du parcours
       de tabulation, sinon chaque parution est annoncee et atteinte deux
       fois ;
     - sans script, la rangee reste une grille immobile, complete ;
     - la duree est proportionnelle au nombre de parutions, sinon
       ajouter une coupure de presse accelererait tout le ruban. */
  const presse = document.getElementById("presse-liste");

  if (presse && presse.children.length > 2) {
    const piste = document.createElement("div");
    piste.className = "presse__piste";
    piste.append(...presse.children);

    const copie = piste.cloneNode(true);
    for (const article of copie.children) {
      article.setAttribute("aria-hidden", "true");
      for (const lien of article.querySelectorAll("a")) lien.tabIndex = -1;
    }
    piste.append(...copie.children);

    presse.append(piste);
    presse.dataset.ruban = "oui";
    presse.dataset.anime = "oui";

    // 6 secondes par parution : le ruban garde la meme allure qu'il en
    // compte cinq ou douze.
    const parutions = piste.children.length / 2;
    // En !important : le bloc « moins de mouvement » de la feuille ecrase
    // toutes les durees d'animation, y compris celle-ci. Les deux rubans
    // sont les seuls mouvements que le site conserve dans tous les cas.
    piste.style.setProperty("animation-duration", parutions * 6 + "s", "important");

  }

  /* ---- Témoignages : les cartes se posent ----
     Une seule fois, a l'entree dans le champ. Le decalage est porte par
     une variable sur chaque carte ; le reste — inclinaison, guillemet,
     filet — est du CSS. */
  const temoignages = document.getElementById("temoignages-liste");

  if (temoignages) {
    [...temoignages.children].forEach((carte, i) => carte.style.setProperty("--i", i));

    new IntersectionObserver((entrees, oeil) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        temoignages.dataset.pose = "oui";
        oeil.unobserve(entree.target);
      }
    }, { threshold: 0.15 }).observe(temoignages);
  }

  /* ---- ADN : les piliers se posent ----
     Meme principe que les temoignages. Le seuil est plus haut parce que
     la liste porte 150 px de retrait au-dessus d'elle, pour degager
     l'arc : a 0,15 elle aurait ete declaree visible alors que seul ce
     vide etait a l'ecran, et les piliers seraient montes avant qu'on
     puisse les voir. */
  const adnListe = document.getElementById("adn-liste");

  if (adnListe) {
    [...adnListe.children].forEach((pilier, i) => pilier.style.setProperty("--i", i));

    new IntersectionObserver((entrees, oeil) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        adnListe.dataset.pose = "oui";
        oeil.unobserve(entree.target);
      }
    }, { threshold: 0.4 }).observe(adnListe);
  }

  /* ---- Visionneuse d'images ----
     Le declencheur est un lien vers l'image : sans script, le clic ouvre le
     fichier, ce qui reste utilisable. Avec script, on ouvre le dialogue
     natif, qui gere deja le piege de tabulation, la touche Echap et le
     retour du focus sur le lien. */
  const visionneuse = document.getElementById("visionneuse");
  const declencheurs = document.querySelectorAll("[data-agrandir]");

  if (visionneuse && declencheurs.length && typeof visionneuse.showModal === "function") {
    const image = document.getElementById("visionneuse-image");
    const legende = document.getElementById("visionneuse-legende");
    const fermer = document.getElementById("visionneuse-fermer");

    declencheurs.forEach((declencheur) => {
      declencheur.addEventListener("click", (e) => {
        e.preventDefault();
        image.src = declencheur.dataset.agrandir;
        image.alt = declencheur.dataset.agrandirAlt || "";
        legende.textContent = declencheur.dataset.agrandirLegende || "";
        legende.hidden = !legende.textContent;
        visionneuse.showModal();
      });
    });

    if (fermer) fermer.addEventListener("click", () => visionneuse.close());

    /* Un clic hors de l'image ferme : le dialogue occupe tout l'ecran, donc
       la cible du clic n'est le dialogue lui-meme que dans sa marge. */
    visionneuse.addEventListener("click", (e) => {
      if (e.target === visionneuse) visionneuse.close();
    });

    /* L'image est liberee a la fermeture : la garder chargee n'a pas d'utilite
       et la prochaine ouverture peut montrer une autre photo. */
    visionneuse.addEventListener("close", () => {
      image.removeAttribute("src");
      image.alt = "";
    });
  }

  /* ---- Tenue claire / sombre ----
     La tenue initiale est posee par le petit script du <head>, avant le
     premier rendu. Ici on ne gere que la bascule et sa memorisation. Sans
     choix enregistre, la feuille suit prefers-color-scheme ; des le premier
     clic, le choix du visiteur l'emporte. */
  const basculeTheme = document.getElementById("bascule-theme");

  if (basculeTheme) {
    const racine = document.documentElement;
    const libelle = document.getElementById("bascule-theme-libelle");
    const systemeSombre = window.matchMedia("(prefers-color-scheme: dark)");

    const estSombre = () =>
      racine.dataset.theme ? racine.dataset.theme === "dark" : systemeSombre.matches;

    const refleter = () => {
      const sombre = estSombre();
      basculeTheme.setAttribute("aria-pressed", String(sombre));
      if (libelle) libelle.textContent = sombre ? "Passer en tenue claire" : "Passer en tenue sombre";
    };

    basculeTheme.addEventListener("click", () => {
      racine.dataset.theme = estSombre() ? "light" : "dark";
      try {
        localStorage.setItem("map73-theme", racine.dataset.theme);
      } catch (e) {
        /* Navigation privee ou stockage refuse : la tenue tient pour la
           visite en cours, elle ne survit simplement pas au rechargement. */
      }
      refleter();
    });

    /* Tant que le visiteur n'a pas choisi, on suit le systeme en direct. */
    systemeSombre.addEventListener("change", () => {
      if (!racine.dataset.theme) refleter();
    });

    refleter();
  }

  /* ---- Formules : le selecteur de niveau ----
     Les onglets sont caches dans le HTML et reveles ici : sans script, les
     sept formules restent affichees a la suite, ce qui vaut mieux qu'une
     rangee de boutons inertes. */
  const onglets = document.getElementById("formules-onglets");
  const formules = document.querySelectorAll(".formule[data-niveau]");

  /* Le libelle du bouton du hero n'est repris que sur un choix explicite :
     mis a jour au chargement, il aurait annonce « Troisieme » a un visiteur
     qui n'a rien demande, alors que ce niveau n'est qu'un etat de depart. */
  const nomDuNiveau = {
    troisieme: "Troisième",
    seconde: "Seconde",
    premiere: "Première",
    terminale: "Terminale"
  };

  const choisirNiveau = (niveau, options) => {
    if (!onglets) return;
    const reglages = options || {};

    onglets.querySelectorAll(".onglet-niveau").forEach((onglet) => {
      const actif = onglet.dataset.niveau === niveau;
      onglet.setAttribute("aria-selected", String(actif));
      onglet.tabIndex = actif ? 0 : -1;
      if (actif && reglages.focus) onglet.focus();
    });

    formules.forEach((formule) => {
      formule.hidden = formule.dataset.niveau !== niveau;
    });

    const etiquette = document.getElementById("classe-choisie");
    if (etiquette && reglages.nommer && nomDuNiveau[niveau]) {
      etiquette.textContent = nomDuNiveau[niveau];
    }
  };

  if (onglets && formules.length) {
    onglets.hidden = false;
    const conteneurFormules = document.getElementById("formules-liste");
    if (conteneurFormules) conteneurFormules.classList.add("formules--filtre");

    /* Chaque formule devient le panneau de son onglet : sans ce lien, un
       lecteur d'ecran annonce des onglets qui ne commandent rien. */
    formules.forEach((formule) => {
      const onglet = onglets.querySelector('[data-niveau="' + formule.dataset.niveau + '"]');
      if (!onglet) return;
      if (!onglet.id) onglet.id = "onglet-" + formule.dataset.niveau;
      formule.setAttribute("role", "tabpanel");
      formule.setAttribute("aria-labelledby", onglet.id);
      onglet.setAttribute("aria-controls", formule.id);
    });

    onglets.addEventListener("click", (e) => {
      const onglet = e.target.closest(".onglet-niveau");
      if (onglet) choisirNiveau(onglet.dataset.niveau, { nommer: true });
    });

    /* Fleches, Origine et Fin : le parcours clavier attendu d'un tablist. */
    onglets.addEventListener("keydown", (e) => {
      const liste = [...onglets.querySelectorAll(".onglet-niveau")];
      const courant = liste.indexOf(document.activeElement);
      if (courant < 0) return;

      const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      let cible = null;

      if (pas) cible = (courant + pas + liste.length) % liste.length;
      else if (e.key === "Home") cible = 0;
      else if (e.key === "End") cible = liste.length - 1;
      else return;

      e.preventDefault();
      choisirNiveau(liste[cible].dataset.niveau, { focus: true, nommer: true });
    });

    /* Un lien profond vers une formule doit ouvrir le bon onglet, sinon il
       mene a une carte masquee. Vaut au chargement et sur changement de
       fragment. */
    const suivreFragment = () => {
      let vise = null;
      try {
        /* Un fragment qui n'est pas un selecteur valide (#1abc) ferait lever
           querySelector : on retombe sur le niveau par defaut. */
        vise = document.querySelector('.formule[data-niveau]' + (location.hash || "#aucun"));
      } catch (e) {}
      choisirNiveau(vise ? vise.dataset.niveau : "troisieme", { nommer: Boolean(vise) });
    };

    window.addEventListener("hashchange", suivreFragment);
    suivreFragment();
  }

  /* ---- Le dialogue « en quelle classe est votre enfant ? » ----
     Le declencheur est un lien vers les formules : sans script, le clic y
     mene et les sept formules sont la. Avec script, il ouvre le dialogue. */
  const modaleClasse = document.getElementById("modale-classe");
  const ouvrirClasses = document.getElementById("ouvrir-classes");

  if (modaleClasse && ouvrirClasses && typeof modaleClasse.showModal === "function") {
    ouvrirClasses.addEventListener("click", (e) => {
      e.preventDefault();
      modaleClasse.showModal();
    });

    const fermer = document.getElementById("fermer-classes");
    if (fermer) fermer.addEventListener("click", () => modaleClasse.close());

    /* Le dialogue occupe tout l'ecran : la cible du clic n'est le dialogue
       lui-meme que dans la marge, hors du panneau. */
    modaleClasse.addEventListener("click", (e) => {
      if (e.target === modaleClasse) modaleClasse.close();
    });

    modaleClasse.addEventListener("click", (e) => {
      const choix = e.target.closest(".classe-choix");
      if (!choix) return;

      modaleClasse.close();
      choisirNiveau(choix.dataset.niveau, { nommer: true });

      /* On amene le visiteur sur la formule qu'il vient de demander : la
           laisser sous le pli reviendrait a ne rien afficher. */
      const cible = document.getElementById("formules");
      if (cible) cible.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---- Année du copyright ---- */
  const annee = document.getElementById("annee");
  if (annee) annee.textContent = String(new Date().getFullYear());

  /* ---- Formulaire de contact ---- */
  const formulaire = document.getElementById("formulaire-contact");
  const etat = document.getElementById("etat-formulaire");

  if (formulaire && etat) {
    const afficher = (message) => {
      etat.textContent = message;
      etat.hidden = false;
    };

    formulaire.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!formulaire.checkValidity()) {
        formulaire.reportValidity();
        return;
      }

      const donnees = new FormData(formulaire);

      // Aucun service d'envoi tiers : le message part par le client mail.
      const corps = [
        `Prénom : ${donnees.get("prenom")}`,
        `Nom : ${donnees.get("nom")}`,
        `E-mail : ${donnees.get("email")}`,
        `Téléphone : ${donnees.get("telephone") || "non communiqué"}`,
        `Classe : ${donnees.get("niveau") || "non précisée"}`,
        "",
        String(donnees.get("message") || "")
      ].join("\n");

      window.location.href =
        "mailto:contacts@map73.fr?subject=" +
        encodeURIComponent("Demande depuis le site MAP73") +
        "&body=" +
        encodeURIComponent(corps);

      afficher("Votre messagerie s’ouvre avec le message pré-rempli. Vous pouvez aussi nous écrire directement à contacts@map73.fr.");
    });
  }
})();
