// ============================================================
// ACCÈS — gestion des comptes du panel, réservée au superadministrateur
//
// Rien ne passe par Firestore ici : créer un compte Firebase demande la clé
// de service, et les règles interdisent d'écrire dans `admins` depuis le
// navigateur. Tout transite par le Worker, qui refait le contrôle de rôle
// de son côté — masquer l'onglet ne protège rien.
// ============================================================

import { appelerWorker, jetonCourant } from "./auth.js?v=20260912-2116";
import { $, el, etat, confirmer } from "./ui.js?v=20260912-2116";

function formaterDate(millisecondes) {
  if (!millisecondes) return "";
  return new Date(Number(millisecondes)).toLocaleDateString("fr-FR", { dateStyle: "long" });
}

function messageAcces(texte, ton = "") {
  const zone = $("acces-etat");
  zone.textContent = texte;
  if (ton) zone.dataset.ton = ton;
  else delete zone.dataset.ton;
}

async function charger() {
  const liste = $("acces-liste");
  liste.textContent = "";
  liste.appendChild(el("p", { classe: "admin-panneau__intro", texte: "Chargement…" }));

  try {
    const { membres } = await appelerWorker("/membres", { idToken: await jetonCourant() });
    liste.textContent = "";

    for (const membre of membres) {
      const titre = el("p", {
        classe: "fiche__titre",
        texte: membre.nom || membre.email
      });

      const retirer = el("button", {
        classe: "icone-bouton icone-bouton--danger",
        texte: "×",
        attributs: { type: "button", title: "Retirer cet accès" }
      });
      retirer.addEventListener("click", () => retirerAcces(membre));

      const entete = el("div", {
        classe: "fiche__entete",
        enfants: [titre, el("div", { classe: "fiche__outils", enfants: [retirer] })]
      });

      const details = [
        membre.email,
        membre.role === "superadmin" ? "Superadministrateur" : "Éditrice ou éditeur",
        membre.creeLe ? `accès créé le ${formaterDate(membre.creeLe)}` : ""
      ].filter(Boolean).join(" · ");

      liste.appendChild(
        el("article", {
          classe: "fiche",
          enfants: [entete, el("p", { classe: "champ__indice", texte: details })]
        })
      );
    }

    if (!membres.length) {
      liste.appendChild(el("p", { classe: "admin-panneau__intro", texte: "Aucun accès enregistré." }));
    }
  } catch (erreur) {
    liste.textContent = "";
    liste.appendChild(el("p", { classe: "admin-panneau__intro", texte: erreur.message }));
  }
}

async function retirerAcces(membre) {
  const nom = membre.nom || membre.email;
  if (!confirmer(`Retirer l’accès de ${nom} ? Le compte ne pourra plus ouvrir le panel.`)) return;

  const supprimerLeCompte = window.confirm(
    `Supprimer aussi définitivement le compte Firebase de ${nom} ?\n\nAnnuler retire seulement l’accès au panel.`
  );

  try {
    await appelerWorker("/membres/retirer", {
      idToken: await jetonCourant(),
      uid: membre.uid,
      supprimerLeCompte
    });
    messageAcces(`Accès de ${nom} retiré.`, "succes");
    await charger();
  } catch (erreur) {
    messageAcces(erreur.message, "erreur");
  }
}

async function creerAcces(e) {
  e.preventDefault();
  messageAcces("");

  const bouton = $("formulaire-acces").querySelector("button[type=submit]");
  bouton.disabled = true;

  try {
    const reponse = await appelerWorker("/membres/creer", {
      idToken: await jetonCourant(),
      nom: $("acces-nom").value.trim(),
      email: $("acces-email").value.trim(),
      motDePasse: $("acces-mdp").value,
      role: $("acces-role").value
    });

    $("formulaire-acces").reset();
    messageAcces(
      reponse.motDePasseIgnore
        ? "Accès ouvert. Un compte existait déjà pour cette adresse : son mot de passe n’a pas été changé."
        : "Accès créé. Transmettez le mot de passe de vive voix, jamais par e-mail.",
      "succes"
    );
    await charger();
  } catch (erreur) {
    messageAcces(erreur.message, "erreur");
  } finally {
    bouton.disabled = false;
  }
}

export function initAcces(role) {
  const onglet = document.querySelector('.admin-onglet[data-panneau="acces"]');
  const ouvert = role === "superadmin";

  onglet.hidden = !ouvert;
  if (!ouvert) return;

  $("formulaire-acces").addEventListener("submit", creerAcces);
  $("bouton-recharger-acces").addEventListener("click", charger);

  // Chargé à la première ouverture de l'onglet, pas au démarrage : inutile
  // d'appeler le Worker pour un panneau que personne n'a encore regardé.
  let dejaCharge = false;
  onglet.addEventListener("click", () => {
    if (dejaCharge) return;
    dejaCharge = true;
    charger().catch(() => {
      dejaCharge = false;
      etat("Liste des accès indisponible.", "erreur");
    });
  });
}
