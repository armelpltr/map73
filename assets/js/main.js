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

  /* ---- Ombre de l'en-tête au défilement ---- */
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
