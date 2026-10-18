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

  /* ---- Les vagues néon du hero ----
     Trois tubes, bleu, vert, bleu, qui ondulent sous le texte. Le canevas
     ne dessine que net : le flou est un filtre CSS posé sur lui. Le
     dessin s'arrête quand le hero sort de l'écran, et se fige sur une
     seule image pour qui a demandé moins de mouvement. */
  const vagues = document.querySelector(".hero__vagues");
  if (vagues && vagues.getContext) {
    const ctx = vagues.getContext("2d");
    const blanchir = (c) => c.map((v) => Math.round(v + (255 - v) * 0.75));
    const tubes = [
      { c: [47, 140, 255], y: 0.80, a: 26, f: 0.0042, v: 0.6, p: 0 },
      { c: [108, 194, 74], y: 0.86, a: 30, f: 0.0035, v: -0.45, p: 2 },
      { c: [47, 140, 255], y: 0.92, a: 22, f: 0.0055, v: 0.8, p: 4 }
    ];
    const immobile = window.matchMedia("(prefers-reduced-motion: reduce)");
    let largeur = 0;
    let hauteur = 0;
    let visible = true;
    let demande = 0;

    const dimensionner = () => {
      const r = vagues.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      largeur = r.width;
      hauteur = r.height;
      vagues.width = Math.round(largeur * dpr);
      vagues.height = Math.round(hauteur * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const dessiner = (t) => {
      ctx.clearRect(0, 0, largeur, hauteur);
      for (const l of tubes) {
        const chemin = new Path2D();
        for (let x = -20; x <= largeur + 20; x += 6) {
          const y = hauteur * l.y +
            l.a * Math.sin(x * l.f + t * l.v + l.p) +
            l.a * 0.45 * Math.sin(x * l.f * 2.3 - t * l.v * 1.4);
          if (x === -20) chemin.moveTo(x, y); else chemin.lineTo(x, y);
        }
        ctx.shadowColor = `rgb(${l.c})`;
        ctx.shadowBlur = 22;
        ctx.strokeStyle = `rgba(${l.c}, 0.75)`;
        ctx.lineWidth = 7.2;
        ctx.stroke(chemin);
        ctx.shadowBlur = 6;
        ctx.strokeStyle = `rgba(${blanchir(l.c)}, 0.6)`;
        ctx.lineWidth = 2.25;
        ctx.stroke(chemin);
      }
      ctx.shadowBlur = 0;
    };

    const image = (maintenant) => {
      demande = 0;
      dessiner(maintenant / 1000);
      if (visible && !immobile.matches) demande = requestAnimationFrame(image);
    };
    const relancer = () => {
      if (!demande) demande = requestAnimationFrame(image);
    };

    dimensionner();
    relancer();
    window.addEventListener("resize", () => {
      dimensionner();
      relancer();
    });
    immobile.addEventListener("change", relancer);
    new IntersectionObserver(([entree]) => {
      visible = entree.isIntersecting;
      if (visible) relancer();
    }).observe(vagues);
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

  /* ---- L'arrivee : le logo, puis la vague ----
     Le script du <head> a decide s'il y a une arrivee (data-intro) et le
     CSS affiche deja le logo en grand. Ici, passe un court instant, les
     trois vagues neon du hero montent du bas comme une maree : le voile se
     retire au-dessus d'elles et decouvre la page. retardHero dit au
     balayage du hero d'attendre que la vague l'ait depasse. */
  const PAUSE_INTRO = 1450;
  const DUREE_VAGUE = 1500;
  const voileIntro = document.getElementById("intro");
  const avecIntro = document.documentElement.dataset.intro === "oui" && voileIntro;
  // Le hero est decouvert a peu pres au tiers de la montee.
  const retardHero = avecIntro ? Math.max(0, PAUSE_INTRO + DUREE_VAGUE * 0.35 - performance.now()) : 0;

  if (avecIntro) {
    const toile = voileIntro.querySelector(".intro__vague");
    const logo = voileIntro.querySelector(".intro__logo");
    const ctx = toile.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const largeur = window.innerWidth;
    const hauteur = window.innerHeight;
    toile.width = largeur * dpr;
    toile.height = hauteur * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // La meme famille de courbes que les vagues du hero, en plus vif.
    const tubes = [
      { c: "47,140,255", d: 0, a: 26, f: 0.0042, v: 0.6, p: 0 },
      { c: "108,194,74", d: 34, a: 30, f: 0.0035, v: -0.45, p: 2 },
      { c: "47,140,255", d: 70, a: 22, f: 0.0055, v: 0.8, p: 4 }
    ];
    const courbe = (l, x, t, base) =>
      base + l.d + l.a * Math.sin(x * l.f + t * l.v * 3 + l.p) + l.a * 0.45 * Math.sin(x * l.f * 2.3 - t * l.v * 4);
    const glisse = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const paper = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#0b1a2e";

    const terminer = () => {
      voileIntro.remove();
      document.documentElement.removeAttribute("data-intro");
    };

    const image = (maintenant) => {
      const t = maintenant / 1000;
      const u = Math.min(Math.max((maintenant - PAUSE_INTRO) / DUREE_VAGUE, 0), 1);
      voileIntro.dataset.vague = "oui";
      // Le bord de la vague monte du bas jusqu'au-dessus de l'ecran.
      const base = hauteur + 40 - glisse(u) * (hauteur + 260);
      ctx.clearRect(0, 0, largeur, hauteur);

      // Le voile, au-dessus de la vague, avec le logo dedans.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= largeur + 8; x += 8) ctx.lineTo(x, courbe(tubes[0], x, t, base) - 10);
      ctx.lineTo(largeur, 0);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, largeur, hauteur);
      const lueur = ctx.createRadialGradient(largeur * 0.74, hauteur * 0.34, 0, largeur * 0.74, hauteur * 0.34, 480);
      lueur.addColorStop(0, "rgba(47,140,255,.16)");
      lueur.addColorStop(1, "rgba(47,140,255,0)");
      ctx.fillStyle = lueur;
      ctx.fillRect(0, 0, largeur, hauteur);
      const cadre = logo.getBoundingClientRect();
      // Le logo garde la lueur verte qu'il avait en CSS.
      ctx.shadowColor = "rgba(108,194,74,.35)";
      ctx.shadowBlur = 10;
      ctx.drawImage(logo, cadre.left, cadre.top, cadre.width, cadre.height);
      ctx.restore();

      // Les trois tubes sur le bord : le halo en traits superposes, du
      // plus large au coeur, bien moins couteux qu'une ombre floue.
      for (const l of tubes) {
        ctx.beginPath();
        for (let x = -10; x <= largeur + 10; x += 6) {
          const y = courbe(l, x, t, base);
          if (x === -10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (const [epaisseur, opacite] of [[18, 0.1], [10, 0.22], [5, 0.55]]) {
          ctx.strokeStyle = "rgba(" + l.c + "," + opacite + ")";
          ctx.lineWidth = epaisseur;
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(235,248,255,.7)";
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      if (u < 1) requestAnimationFrame(image);
      else terminer();
    };

    // La vague part apres la pause, une fois le logo charge (il est
    // recopie sur le canevas) ; rien ne tourne pendant l'attente.
    const partir = () => setTimeout(() => requestAnimationFrame(image), Math.max(0, PAUSE_INTRO - performance.now()));
    if (logo.complete) partir();
    else logo.addEventListener("load", partir, { once: true });
  }

  /* ---- Entree en balayage ----
     Un trait neon vert traverse chaque bloc de gauche a droite et devoile
     le contenu dans son sillage : le hero a l'ouverture, puis chaque titre
     et chaque carte a son arrivee a l'ecran. Les chiffres comptent depuis
     zero. Tout passe par element.animate() ; rien n'est cache sans script,
     ni pour ceux qui ont demande moins de mouvement. Le ruban de presse
     bouge deja, il n'est pas balaye. */
  const sansMouvement = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!sansMouvement && "animate" in Element.prototype) {
    const COURBE = "cubic-bezier(.65,0,.35,1)";

    /* Prepare le balayage d'un bloc, fige a son debut ; la fonction rendue
       le joue. Une fois fini, le masque s'en va : il couperait le halo des
       neons. */
    const preparerBalayage = (bloc, delai, duree) => {
      if (getComputedStyle(bloc).position === "static") bloc.style.position = "relative";
      const trait = document.createElement("span");
      trait.className = "balayage";
      trait.setAttribute("aria-hidden", "true");
      bloc.append(trait);
      const reglage = { duration: duree, delay: delai, easing: COURBE, fill: "both" };
      const masque = bloc.animate([
        { clipPath: "inset(-20px 100% -20px -20px)" },
        { clipPath: "inset(-20px -40px -20px -20px)" },
      ], reglage);
      const passage = trait.animate([
        { left: "0%", opacity: 0 },
        { left: "0%", opacity: 1, offset: 0.05 },
        { left: "100%", opacity: 1, offset: 0.95 },
        { left: "100%", opacity: 0 },
      ], reglage);
      masque.pause();
      passage.pause();
      masque.onfinish = () => { masque.cancel(); trait.remove(); };
      return () => { masque.play(); passage.play(); };
    };

    /* Le hero, des l'ouverture. */
    [".hero h1", ".hero__chapo", ".hero__actions", ".hero__classe"].forEach((selecteur, i) => {
      const bloc = document.querySelector(selecteur);
      if (bloc) preparerBalayage(bloc, retardHero + 200 + i * 220, 1100)();
    });

    /* Le reste, a l'arrivee a l'ecran. Les cartes d'une meme rangee
       partent l'une apres l'autre. */
    const aBalayer = new Map();
    document.querySelectorAll(".section h2:not(.modale-classe__titre)").forEach((titre) => {
      aBalayer.set(titre, preparerBalayage(titre, 0, 1000));
    });
    document.querySelectorAll(".bento > *, .news__carte, .adn__pilier, .pilier, .classes-cartes > li, .formule, .fondatrice, .billet")
      .forEach((carte) => {
        const rang = [...carte.parentNode.children].indexOf(carte) % 4;
        aBalayer.set(carte, preparerBalayage(carte, rang * 140, 900));
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
