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

  /* ---- Témoignages : l'eventail ----
     Les cartes se deploient en eventail : celle du milieu se lit, ses
     voisines penchent sur les cotes. Les fleches font tourner, un clic sur
     une voisine l'amene au centre. Sans script, les cartes restent en
     colonnes, toutes lisibles. */
  const temoignages = document.getElementById("temoignages-liste");

  if (temoignages) {
    const cartes = [...temoignages.querySelectorAll(".temoignage")];
    const total = cartes.length;
    let actif = Math.min(1, total - 1);

    /* Le prenom en tete de carte, tire de la legende : « Maman de Clemence,
       premiere generale » donne « Clemence ». */
    cartes.forEach((carte) => {
      const legende = carte.querySelector("figcaption");
      if (!legende) return;
      const nom = legende.textContent.split(",")[0].replace(/^Maman d(e |’)/, "").trim();
      const initiale = document.createElement("span");
      initiale.className = "temoin__initiale";
      initiale.setAttribute("aria-hidden", "true");
      initiale.textContent = nom.charAt(0);
      const titre = document.createElement("span");
      titre.className = "temoin__nom";
      titre.setAttribute("aria-hidden", "true");
      titre.textContent = nom;
      carte.prepend(initiale, titre);
    });

    const placer = () => cartes.forEach((carte, i) => {
      let ecart = i - actif;
      if (ecart > total / 2) ecart -= total;
      if (ecart < -total / 2) ecart += total;
      carte.style.setProperty("--d", ecart);
      carte.style.setProperty("--a", Math.abs(ecart));
      carte.toggleAttribute("data-actif", ecart === 0);
      carte.toggleAttribute("data-loin", Math.abs(ecart) > 1);
    });

    const tourner = (pas) => {
      actif = (actif + pas + total) % total;
      placer();
    };

    cartes.forEach((carte, i) => carte.addEventListener("click", () => {
      actif = i;
      placer();
    }));

    const fleches = document.createElement("div");
    fleches.className = "temoins__fleches";
    fleches.innerHTML = '<button type="button" aria-label="Témoignage précédent">←</button>' +
      '<button type="button" aria-label="Témoignage suivant">→</button>';
    const [precedent, suivant] = fleches.children;
    precedent.addEventListener("click", () => tourner(-1));
    suivant.addEventListener("click", () => tourner(1));
    temoignages.after(fleches);

    temoignages.dataset.eventail = "oui";
    placer();
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

  /* ---- L'arrivee sur le site ----
     Tout se joue en CSS (voir « L'arrivee sur le site » dans la feuille de
     style) : le logo, puis la phrase, puis le voile qui se dissout. Il ne
     reste ici que deux choses. Retirer le voile une fois l'arrivee passee,
     parce qu'une couche fixe en plein ecran, meme invisible, continue
     d'etre composee. Et dire au laser des titres de patienter : balayer un
     titre cache ne se verrait pas.

     INTRO_FIN est la fin de la minuterie CSS ; les deux doivent bouger
     ensemble, sans quoi le voile s'attarde ou part trop tot. */
  const INTRO_FIN = 5400;
  const voileIntro = document.getElementById("intro");
  const avecIntro = document.documentElement.dataset.intro === "oui" && voileIntro;
  // Le titre d'accueil est a nu une fois le voile parti.
  const retardHero = avecIntro ? Math.max(0, INTRO_FIN - performance.now()) : 0;

  if (avecIntro) {
    setTimeout(() => {
      voileIntro.remove();
      document.documentElement.removeAttribute("data-intro");
    }, retardHero);
  }

  /* ---- Le laser des titres ----
     Un trait neon vert entre par la droite, traverse le titre et le devoile
     dans son sillage : le titre d'accueil a l'ouverture, puis le titre de
     chaque section a son arrivee a l'ecran. Les titres seulement : passe sur
     chaque carte et chaque paragraphe, le trait se rencontrait dix fois par
     ecran et ne surprenait plus personne.

     Tout passe par element.animate() ; rien n'est cache sans script, ni
     pour ceux qui ont demande moins de mouvement. */
  const sansMouvement = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!sansMouvement && "animate" in Element.prototype) {
    const COURBE = "cubic-bezier(.65,0,.35,1)";

    /* Prepare le balayage d'un titre, fige a son debut ; la fonction rendue
       le joue. Le masque s'ouvre depuis la droite, le trait le precede.
       Une fois fini, le masque s'en va : il couperait le halo du neon. */
    const preparerBalayage = (bloc, delai, duree) => {
      if (getComputedStyle(bloc).position === "static") bloc.style.position = "relative";
      const trait = document.createElement("span");
      trait.className = "balayage";
      trait.setAttribute("aria-hidden", "true");
      bloc.append(trait);
      const reglage = { duration: duree, delay: delai, easing: COURBE, fill: "both" };
      const masque = bloc.animate([
        { clipPath: "inset(-20px -20px -20px 100%)" },
        { clipPath: "inset(-20px -20px -20px -40px)" },
      ], reglage);
      const passage = trait.animate([
        { left: "100%", opacity: 0 },
        { left: "100%", opacity: 1, offset: 0.05 },
        { left: "0%", opacity: 1, offset: 0.95 },
        { left: "0%", opacity: 0 },
      ], reglage);
      masque.pause();
      passage.pause();
      masque.onfinish = () => { masque.cancel(); trait.remove(); };
      return () => { masque.play(); passage.play(); };
    };

    /* Le titre d'accueil, des que le voile de l'arrivee est parti. */
    const titreHero = document.querySelector(".hero h1");
    if (titreHero) preparerBalayage(titreHero, retardHero + 200, 1100)();

    /* Les titres de section, a leur arrivee a l'ecran. */
    const aBalayer = new Map();
    document.querySelectorAll(".section h2:not(.modale-classe__titre)").forEach((titre) => {
      aBalayer.set(titre, preparerBalayage(titre, 0, 1000));
    });

    const oeilBalayage = new IntersectionObserver((entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        aBalayer.get(entree.target)();
        oeilBalayage.unobserve(entree.target);
      }
    }, { rootMargin: "0px 0px -12% 0px" });
    aBalayer.forEach((jouer, bloc) => oeilBalayage.observe(bloc));

    /* Les chiffres comptent depuis zero, une fois a l'ecran. */
    const oeilChiffres = new IntersectionObserver((entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        oeilChiffres.unobserve(entree.target);
        const valeur = entree.target;
        const texte = valeur.textContent;
        // Un seul nombre, en texte nu : « 1<sup>re</sup> » ou « 1 200 » ne
        // comptent pas.
        const nombres = texte.match(/\d+/g);
        if (valeur.children.length || !nombres || nombres.length > 1) continue;
        const cible = parseInt(nombres[0], 10);
        if (cible < 2) continue;
        const debut = performance.now() + 200;
        const pas = (maintenant) => {
          const k = Math.min(Math.max((maintenant - debut) / 1600, 0), 1);
          valeur.textContent = texte.replace(/\d+/, String(Math.round(cible * (1 - Math.pow(1 - k, 3)))));
          if (k < 1) requestAnimationFrame(pas);
        };
        valeur.textContent = texte.replace(/\d+/, "0");
        requestAnimationFrame(pas);
      }
    }, { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll(".bento__gros, .fondatrice__valeur").forEach((valeur) => oeilChiffres.observe(valeur));
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

  /* ---- Formules : un panneau par classe ----
     Les fiches etaient deroulees a la suite sous les quatre cartes de
     classe : qui venait pour la seconde traversait six fiches qui ne le
     concernaient pas, et l'ensemble se lisait comme un catalogue. Desormais
     la section ne montre que les quatre cartes, et un clic ouvre un panneau
     plein ecran qui ne contient que les fiches du niveau — la fiche de la
     classe, l'intertitre et « a la map », qui vaut pour toutes.

     Le panneau n'est pas un double de la liste : la liste y est deplacee,
     une fois, au chargement. Deux copies auraient voulu deux jeux d'« id »,
     et les liens profonds n'auraient plus su auquel des deux aller.

     Sans script, rien de tout cela : la liste reste dans la section, les
     fiches sont lisibles a la suite et les cartes de classe sont de
     simples liens vers l'ancre de leur fiche. */
  const NOM_DU_NIVEAU = {
    troisieme: "Troisième",
    seconde: "Seconde",
    premiere: "Première",
    terminale: "Terminale"
  };

  const listeFormules = document.getElementById("formules-liste");
  const modaleFormules = document.getElementById("modale-formules");
  const corpsFormules = document.getElementById("modale-formules-corps");

  if (listeFormules && modaleFormules && corpsFormules && typeof modaleFormules.showModal === "function") {
    corpsFormules.append(listeFormules);

    const titreFormules = document.getElementById("modale-formules-titre");
    const quoiFormules = document.getElementById("modale-formules-quoi");
    const fiches = listeFormules.querySelectorAll("[data-niveaux]");
    const cartes = document.querySelectorAll(".classe-carte[data-niveau]");

    /* Le titre du panneau nomme la formule de la classe, « Formule 3e »,
       comme la plaquette ; la phrase dessous est reprise de la carte
       cliquee, mot pour mot. En innerHTML pour garder les exposants, et
       sans risque : la source est notre propre page. */
    const FORMULE_DU_NIVEAU = {
      troisieme: "Formule <em>3<sup>e</sup></em>",
      seconde: "Formule <em>2<sup>de</sup></em>",
      premiere: "Formule <em>1<sup>re</sup></em>",
      terminale: "Formule <em>terminale</em>"
    };
    const intitules = {};
    cartes.forEach((carte) => {
      const quoi = carte.querySelector("p");
      intitules[carte.dataset.niveau] = {
        nom: FORMULE_DU_NIVEAU[carte.dataset.niveau] || NOM_DU_NIVEAU[carte.dataset.niveau] || "",
        quoi: quoi ? quoi.innerHTML : ""
      };
    });

    const ouvrirFormules = (niveau) => {
      const intitule = intitules[niveau];
      if (!intitule) return;

      titreFormules.innerHTML = intitule.nom;
      quoiFormules.innerHTML = intitule.quoi;

      fiches.forEach((fiche) => {
        fiche.hidden = !fiche.dataset.niveaux.split(" ").includes(niveau);
      });

      /* Le bouton du hero annonce la classe retenue : le panneau se ferme,
         le choix doit rester visible quelque part. */
      const etiquette = document.getElementById("classe-choisie");
      if (etiquette && NOM_DU_NIVEAU[niveau]) etiquette.textContent = NOM_DU_NIVEAU[niveau];

      if (!modaleFormules.open) modaleFormules.showModal();
      /* Deux classes de suite : la seconde s'ouvrirait la ou la premiere
         avait ete laissee. */
      corpsFormules.scrollTop = 0;
    };

    cartes.forEach((carte) => {
      carte.addEventListener("click", (e) => {
        e.preventDefault();
        ouvrirFormules(carte.dataset.niveau);
      });
    });

    const fermerFormules = () => modaleFormules.close();
    const bouton = document.getElementById("fermer-formules");
    if (bouton) bouton.addEventListener("click", fermerFormules);
    modaleFormules.querySelectorAll("[data-fermer-formules]").forEach((b) => {
      b.addEventListener("click", fermerFormules);
    });

    /* Le panneau occupe tout l'ecran : la cible du clic n'est le dialogue
       lui-meme que dans sa marge. */
    modaleFormules.addEventListener("click", (e) => {
      if (e.target === modaleFormules) fermerFormules();
    });

    /* Un lien profond vers une fiche — #formule-map-seconde, une adresse
       deja partagee — ouvre le panneau sur sa classe, sinon il ne menerait
       plus a rien maintenant que la liste a quitte la page. Au premier
       affichage on attend que le voile de l'arrivee soit parti : un panneau
       qui s'ouvre derriere lui ne se verrait pas. */
    const suivreFragment = () => {
      let vise = null;
      try {
        /* Un fragment qui n'est pas un selecteur valide (#1abc) ferait lever
           querySelector : on ne fait alors rien. */
        vise = listeFormules.querySelector("[data-niveaux]" + (location.hash || "#aucun"));
      } catch (e) {}
      if (vise) ouvrirFormules(vise.dataset.niveaux.split(" ")[0]);
    };

    window.addEventListener("hashchange", suivreFragment);
    if (location.hash) setTimeout(suivreFragment, retardHero);

    /* ---- Le dialogue « en quelle classe est votre enfant ? » ----
       Le declencheur est un lien vers les formules : sans script, le clic y
       mene et toutes les fiches sont la. Avec script, il ouvre le choix des
       quatre classes, qui enchaine sur le panneau du niveau retenu. */
    const modaleClasse = document.getElementById("modale-classe");
    const ouvrirClasses = document.getElementById("ouvrir-classes");

    if (modaleClasse && ouvrirClasses && typeof modaleClasse.showModal === "function") {
      ouvrirClasses.addEventListener("click", (e) => {
        e.preventDefault();
        modaleClasse.showModal();
      });

      const fermer = document.getElementById("fermer-classes");
      if (fermer) fermer.addEventListener("click", () => modaleClasse.close());

      modaleClasse.addEventListener("click", (e) => {
        if (e.target === modaleClasse) modaleClasse.close();
      });

      modaleClasse.addEventListener("click", (e) => {
        const choix = e.target.closest(".classe-choix");
        if (!choix) return;
        modaleClasse.close();
        ouvrirFormules(choix.dataset.niveau);
      });
    }
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
