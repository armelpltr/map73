// ============================================================
// MEMBRE — un seul contrôle d'accès pour toutes les routes du panel
//
// Ce Worker parle à Firestore avec la clé de service, qui **contourne les
// règles**. L'exigence de double authentification posée dans
// `firestore.rules` ne le protège donc pas : chaque route doit la refaire
// elle-même, et c'est ce que fait cette fonction.
//
// Deux rôles :
//   superadmin — le contenu, et la gestion des accès
//   editeur    — le contenu du site, rien d'autre
// ============================================================

import { httpError } from './http.js';
import { verifyIdToken, firestoreGet, fromFirestoreFields } from './firebase.js';

/**
 * Vrai si le porteur du jeton a franchi la double authentification depuis
 * CE poste. Même condition que `a2fFranchie()` dans les règles Firestore,
 * et il faut que les deux restent identiques :
 *
 *   - `a2fUntil`, la validité, en millisecondes ;
 *   - `a2fAuthTime` égal à `auth_time`, qui distingue ce poste du compte en
 *     général. Un attribut personnalisé vaut pour TOUT jeton émis pour ce
 *     compte, où qu'il se connecte ; sans cette seconde condition, ouvrir
 *     une session ailleurs pendant la validité hériterait du « validé »
 *     sans jamais recevoir de code.
 */
export function a2fFranchie(claims) {
  const jusqua = Number(claims?.a2fUntil ?? 0);
  const posePour = claims?.a2fAuthTime;
  return Number.isFinite(jusqua)
      && jusqua > Date.now()
      && posePour !== undefined
      && posePour === claims?.auth_time;
}

/**
 * Vérifie le jeton, l'appartenance à `admins`, la double authentification
 * et, si `gestion` est demandé, le rôle.
 *
 * `exigerA2F: false` n'est légitime que dans les routes de la double
 * authentification elle-même : on ne peut pas exiger d'avoir franchi une
 * porte pour ouvrir cette porte.
 */
export async function membreOuRefus(idToken, env, { exigerA2F = true, gestion = false } = {}) {
  let user;
  try {
    user = await verifyIdToken(idToken, env);
  } catch {
    throw httpError('Session invalide. Reconnectez-vous.', 401);
  }

  let membre;
  try {
    const doc = await firestoreGet(`admins/${user.localId}`, env);
    membre = fromFirestoreFields(doc.fields);
  } catch {
    throw httpError("Ce compte n'a pas accès au panel.", 403);
  }

  if (membre.actif === false) {
    throw httpError('Cet accès a été suspendu.', 403);
  }

  if (exigerA2F && !a2fFranchie(user.claims)) {
    throw httpError('Double authentification requise. Reconnectez-vous.', 401);
  }

  const role = membre.role === 'superadmin' ? 'superadmin' : 'editeur';
  if (gestion && role !== 'superadmin') {
    throw httpError('Action réservée au superadministrateur.', 403);
  }

  /* L'adresse du compte Firebase d'abord, celle du document `admins`
     seulement en secours : c'est celle avec laquelle on vient de
     s'authentifier, donc forcément la bonne. Le champ de `admins` n'est
     qu'une copie faite à la création de l'accès, et une copie diverge —
     c'est vers elle que partiraient les codes de double authentification. */
  return {
    uid: user.localId,
    email: user.email || membre.email || '',
    nom: membre.nom || '',
    role,
    authTime: user.authTime
  };
}
