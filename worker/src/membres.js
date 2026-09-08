// ============================================================
// POST /membres        — liste les accès au panel
// POST /membres/creer  — crée un accès
// POST /membres/retirer — le supprime
//
// Réservé au superadministrateur. Il n'existe aucune inscription publique :
// un compte Firebase créé par un autre chemin n'a pas d'entrée dans
// `admins`, donc ni connexion au panel, ni écriture — les règles Firestore
// l'exigent, et ce Worker aussi.
//
// La création passe forcément par ici : le SDK du navigateur ne sait créer
// un compte qu'en s'y connectant aussitôt, ce qui déconnecterait le
// superadmin, et rien n'empêcherait de créer un compte sans l'inscrire.
// ============================================================

import { json, httpError } from './http.js';
import { membreOuRefus } from './membre.js';
import {
  createAuthUser, deleteAuthUser, findAuthUserByEmail,
  firestoreSet, firestoreDelete, firestoreList, fromFirestoreFields
} from './firebase.js';

const LONGUEUR_MDP_MINIMALE = 12;
const ROLES = ['superadmin', 'editeur'];

function adresseValide(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/* Un mot de passe long, et pas seulement long : la contrainte de longueur
   seule laisse passer « motdepassemotdepasse ». Trois familles de
   caractères sur quatre, c'est le compromis retenu — assez pour écarter les
   mots de passe évidents, pas assez pour pousser à les écrire sur un
   post-it. */
function motDePasseAcceptable(mdp) {
  if (typeof mdp !== 'string' || mdp.length < LONGUEUR_MDP_MINIMALE) return false;
  const familles = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(mdp)).length;
  return familles >= 3;
}

/* ---------- Liste ---------- */

export async function handleMembresListe(request, env, cors) {
  const body = await request.json().catch(() => {
    throw httpError('Requête illisible.', 400);
  });
  await membreOuRefus(body.idToken, env, { gestion: true });

  let documents = [];
  try {
    documents = await firestoreList('admins', env);
  } catch {
    documents = [];
  }

  const membres = documents.map((doc) => {
    const champs = fromFirestoreFields(doc.fields);
    return {
      uid: String(doc.name || '').split('/').pop(),
      nom: champs.nom || '',
      email: champs.email || '',
      role: champs.role === 'superadmin' ? 'superadmin' : 'editeur',
      creeLe: champs.creeLe || null
    };
  });

  return json({ ok: true, membres }, 200, cors);
}

/* ---------- Création ---------- */

export async function handleMembreCreer(request, env, cors) {
  const body = await request.json().catch(() => {
    throw httpError('Requête illisible.', 400);
  });
  const auteur = await membreOuRefus(body.idToken, env, { gestion: true });

  const email = String(body.email ?? '').trim().toLowerCase();
  const nom = String(body.nom ?? '').trim().slice(0, 80);
  const motDePasse = String(body.motDePasse ?? '');
  const role = ROLES.includes(body.role) ? body.role : 'editeur';

  if (!adresseValide(email)) throw httpError('Adresse e-mail invalide.', 400);
  if (!nom) throw httpError('Le nom est obligatoire.', 400);
  if (!motDePasseAcceptable(motDePasse)) {
    throw httpError(
      `Le mot de passe doit faire au moins ${LONGUEUR_MDP_MINIMALE} caractères et mêler majuscules, minuscules, chiffres ou ponctuation.`,
      400
    );
  }

  /* Le compte Firebase peut déjà exister sans figurer dans `admins` : on le
     réutilise plutôt que d'échouer, mais sans toucher à son mot de passe —
     changer celui d'un compte existant depuis cette route en ferait un
     moyen de prendre la main sur n'importe quelle adresse connue. */
  let uid = await createAuthUser({ email, password: motDePasse }, env);
  let motDePasseIgnore = false;

  if (uid === null) {
    const existant = await findAuthUserByEmail(email, env);
    if (!existant) throw httpError('Création du compte impossible.', 500);
    uid = existant.localId;
    motDePasseIgnore = true;
  }

  await firestoreSet(`admins/${uid}`, {
    nom,
    email,
    role,
    actif: true,
    creeLe: Date.now(),
    creePar: auteur.email
  }, env);

  return json({ ok: true, uid, motDePasseIgnore }, 200, cors);
}

/* ---------- Retrait ---------- */

export async function handleMembreRetirer(request, env, cors) {
  const body = await request.json().catch(() => {
    throw httpError('Requête illisible.', 400);
  });
  const auteur = await membreOuRefus(body.idToken, env, { gestion: true });

  const uid = String(body.uid ?? '').trim();
  if (!uid) throw httpError('Accès à retirer non précisé.', 400);

  /* Se retirer soi-même fermerait la porte derrière soi : il n'existe
     aucune autre voie pour recréer un superadmin que la console Firebase. */
  if (uid === auteur.uid) {
    throw httpError('Vous ne pouvez pas retirer votre propre accès.', 400);
  }

  await firestoreDelete(`admins/${uid}`, env);

  // Le défi de double authentification en cours n'a plus lieu d'être.
  try {
    await firestoreDelete(`otpChallenges/${uid}`, env);
  } catch { /* aucun défi en cours */ }

  if (body.supprimerLeCompte === true) {
    await deleteAuthUser(uid, env);
  }

  return json({ ok: true }, 200, cors);
}
