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
     - le bouton d'arret n'existe que si le ruban est monte : sans
       script, la rangee reste une grille immobile ;
     - la duree est proportionnelle au nombre de parutions, sinon
       ajouter une coupure de presse accelererait tout le ruban. */
  const presse = document.getElementById("presse-liste");
  const pause = document.getElementById("presse-pause");

  if (presse && pause && presse.children.length > 2) {
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
    piste.style.animationDuration = parutions * 6 + "s";

    pause.hidden = false;
    pause.addEventListener("click", () => {
      const arrete = presse.dataset.anime === "non";
      presse.dataset.anime = arrete ? "oui" : "non";
      pause.setAttribute("aria-pressed", String(!arrete));
      pause.querySelector(".bouton-pause__mot").textContent =
        arrete ? "Arrêter le défilement" : "Reprendre le défilement";
    });
  }

  /* ---- Témoignages : la rangée qui glisse en continu ----
     Le rail avance tout seul, d'un mouvement continu plutot que par
     sauts : sur un texte, un a-coup toutes les cinq secondes se voit
     plus que la lecture.

     La serie est doublee et la position ramenee a mi-course des qu'on
     y arrive : la copie se presente exactement la ou etait
     l'originale, donc la boucle ne se voit pas. La copie est masquee
     aux lecteurs d'ecran et sortie du parcours de tabulation.

     Le mouvement s'arrete au survol, au clavier, et pendant que le
     visiteur fait glisser la rangee lui-meme ; il reprend deux
     secondes apres son dernier geste. C'est ce qui remplace le bouton
     d'arret : sans lui, il faut au moins que poser le doigt suffise a
     figer le texte qu'on lit. */
  const rail = document.getElementById("temoignages-liste");
  const moinsDeMouvement = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (rail && rail.children.length > 1) {
    for (const carte of [...rail.children]) {
      const copie = carte.cloneNode(true);
      copie.setAttribute("aria-hidden", "true");
      for (const cible of copie.querySelectorAll("a, button")) cible.tabIndex = -1;
      rail.append(copie);
    }

    const VITESSE = 0.03; // pixels par milliseconde, soit 30 px/s : un
                          // temoignage passe en une dizaine de secondes
    let arrets = 0;       // survol, focus, geste en cours
    let reprise = null;
    let visible = false;
    let precedent = null;

    const pas = (maintenant) => {
      if (precedent === null) precedent = maintenant;
      const delta = Math.min(maintenant - precedent, 50);
      precedent = maintenant;

      if (visible && arrets === 0 && !moinsDeMouvement.matches) {
        const moitie = rail.scrollWidth / 2;
        // Le retour a mi-course se fait sur la position, pas sur zero :
        // remettre a zero ferait un saut d'une serie entiere.
        if (rail.scrollLeft >= moitie) rail.scrollLeft -= moitie;
        rail.scrollLeft += VITESSE * delta;
      }
      requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);

    const suspendre = () => { arrets += 1; };
    const relacher = () => { arrets = Math.max(0, arrets - 1); };

    rail.addEventListener("mouseenter", suspendre);
    rail.addEventListener("mouseleave", relacher);
    rail.addEventListener("focusin", suspendre);
    rail.addEventListener("focusout", relacher);

    // Molette, doigt, clavier : on rend la main le temps du geste, puis
    // deux secondes de repit avant de reprendre.
    const geste = () => {
      if (reprise === null) suspendre();
      else clearTimeout(reprise);
      reprise = setTimeout(() => { reprise = null; relacher(); }, 2000);
    };
    for (const evenement of ["pointerdown", "wheel", "keydown", "touchmove"]) {
      rail.addEventListener(evenement, geste, { passive: true });
    }

    // Rien ne tourne tant que la section n'est pas a l'ecran.
    new IntersectionObserver((entrees) => {
      for (const entree of entrees) visible = entree.isIntersecting;
    }, { threshold: 0.2 }).observe(rail);
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
      const action = formulaire.getAttribute("action") || "";

      // Tant qu'aucun service d'envoi n'est configuré, on bascule sur le client mail.
      if (action.includes("REMPLACER")) {
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
        return;
      }

      const bouton = formulaire.querySelector("button[type=submit]");
      if (bouton) bouton.disabled = true;

      try {
        const reponse = await fetch(action, {
          method: "POST",
          body: donnees,
          headers: { Accept: "application/json" }
        });

        if (!reponse.ok) throw new Error(String(reponse.status));

        formulaire.reset();
        afficher("Message envoyé. Nous vous répondons sous 48 heures ouvrées.");
      } catch {
        afficher("L’envoi a échoué. Écrivez-nous à contacts@map73.fr ou appelez le 06 78 36 90 06.");
      } finally {
        if (bouton) bouton.disabled = false;
      }
    });
  }
})();
