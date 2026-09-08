// ============================================================
// POST /a2f/request — envoie un code à six chiffres par e-mail
// POST /a2f/verify  — le vérifie et débloque l'accès au panel
//
// Le principe tient en une phrase : le code n'existe jamais dans le
// navigateur avant d'être saisi. Il est tiré ici, gardé ici, comparé ici.
//
// Il vit dans `otpChallenges/{uid}`, une collection qui n'a AUCUNE règle
// Firestore. Les règles refusent par défaut ce qu'elles n'autorisent pas :
// personne ne peut lire cette collection, pas même le titulaire du compte
// avec sa propre session. Seul ce Worker y accède, par la clé de service.
// Tirer le code côté navigateur, ou le ranger sous un document que
// l'utilisateur peut lire, reviendrait à le lui donner : qui détient le
// mot de passe franchirait la double authentification sans jamais ouvrir
// sa boîte mail.
//
// Et il n'y est pas en clair, mais salé et haché : une fuite du contenu de
// Firestore ne donnerait pas les codes en cours.
// ============================================================

import { json, httpError } from './http.js';
import { membreOuRefus } from './membre.js';
import {
  firestoreGet, firestoreSet, firestoreDelete,
  firestoreIncrement, firestoreUpdate, fromFirestoreFields, setCustomClaims
} from './firebase.js';
import { envoyerCodeA2F } from './mailer.js';

const TTL_MS = 10 * 60 * 1000;      // validité d'un code
const MAX_ESSAIS = 5;               // essais avant invalidation du défi
const MAX_ENVOIS = 5;               // codes demandés par fenêtre
const FENETRE_MS = 30 * 60 * 1000;  // durée de la fenêtre de comptage

/* Durée pendant laquelle le panel reste ouvert après un code validé. Passé
   ce délai, un nouveau code est demandé. */
const VALIDITE_ACCES_MS = 8 * 60 * 60 * 1000;

/* Tirage par rejet plutôt qu'un modulo : 2^32 n'est pas un multiple d'un
   million, et `% 1000000` rendrait les premiers codes légèrement plus
   probables que les autres. */
function genererCode() {
  const a = new Uint32Array(1);
  const plafond = Math.floor(4294967296 / 1000000) * 1000000;
  do { crypto.getRandomValues(a); } while (a[0] >= plafond);
  return String(a[0] % 1000000).padStart(6, '0');
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/* Comparaison à durée constante : un `===` sort au premier caractère
   différent, et ce temps de réponse renseigne sur le début du code. */
function memeCode(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* `exigerA2F: false`, et c'est la seule place où ce soit légitime : on ne
   peut pas demander d'avoir franchi la double authentification pour obtenir
   le code qui la franchit. L'adresse utilisée est celle du compte, jamais
   celle fournie par l'appelant. */
async function membreSansA2F(idToken, env) {
  const membre = await membreOuRefus(idToken, env, { exigerA2F: false });
  if (!membre.email) throw httpError('Aucune adresse e-mail sur ce compte.', 400);
  return membre;
}

function masquer(email) {
  const [avant, apres] = String(email).split('@');
  if (!apres) return '';
  return `${avant.slice(0, 2)}${'•'.repeat(Math.max(1, avant.length - 2))}@${apres}`;
}

/* ---------- Demande d'un code ---------- */

export async function handleA2fRequest(request, env, cors) {
  const body = await request.json().catch(() => {
    throw httpError('Requête illisible.', 400);
  });
  const { uid, email, nom } = await membreSansA2F(body.idToken, env);

  const chemin = `otpChallenges/${uid}`;
  const maintenant = Date.now();

  let debutFenetre = maintenant;
  let precedent = null;
  try {
    const doc = await firestoreGet(chemin, env);
    precedent = fromFirestoreFields(doc.fields);
  } catch { /* aucune demande en cours */ }

  /* Un code déjà parti et encore valable n'est pas remplacé, sauf demande
     explicite de renvoi. `lastSentAt > 0` distingue un envoi confirmé d'un
     défi écrit puis abandonné — sans quoi une requête coupée avant l'envoi
     bloquerait dix minutes durant sans qu'aucun e-mail n'existe. */
  const renvoiExplicite = body.renvoi === true;
  if (precedent) {
    const vraimentEnvoye = (precedent.lastSentAt || 0) > 0;
    const encoreValable = (precedent.expiresAt || 0) > maintenant;

    if (vraimentEnvoye && encoreValable && !renvoiExplicite) {
      return json({
        ok: true,
        dejaEnvoye: true,
        expiresAt: precedent.expiresAt,
        indice: masquer(email)
      }, 200, cors);
    }
    if (maintenant - (precedent.windowStart || 0) < FENETRE_MS) {
      debutFenetre = precedent.windowStart;
    }
  }

  /* Le compteur ne compte que les e-mails réellement partis : sinon une
     panne d'envoi épuiserait le quota sans qu'un seul message existe. */
  const envoisFenetre = debutFenetre === maintenant ? 0 : precedent?.sendsOk || 0;
  if (envoisFenetre >= MAX_ENVOIS) {
    throw httpError('Trop de codes demandés. Réessayez dans une demi-heure.', 429);
  }

  const code = genererCode();
  const sel = crypto.randomUUID();

  await firestoreSet(chemin, {
    codeHash: await sha256(sel + code),
    sel,
    expiresAt: maintenant + TTL_MS,
    attempts: 0,
    sendsOk: envoisFenetre,
    windowStart: debutFenetre,
    lastSentAt: 0
  }, env);

  const envoye = await envoyerCodeA2F({ email, nom, code, minutes: TTL_MS / 60000 }, env);
  if (!envoye) {
    throw httpError("L'envoi du code a échoué. Prévenez l'administrateur du site.", 502);
  }

  // Envoi confirmé : c'est seulement maintenant que le quota est entamé.
  await firestoreUpdate(chemin, { lastSentAt: Date.now() }, env);
  await firestoreIncrement(chemin, 'sendsOk', env);

  return json({ ok: true, expiresAt: maintenant + TTL_MS, indice: masquer(email) }, 200, cors);
}

/* ---------- Vérification ---------- */

export async function handleA2fVerify(request, env, cors) {
  const body = await request.json().catch(() => {
    throw httpError('Requête illisible.', 400);
  });
  const code = String(body.code ?? '').trim();
  if (!/^\d{6}$/.test(code)) throw httpError('Le code doit comporter six chiffres.', 400);

  const { uid, authTime } = await membreSansA2F(body.idToken, env);
  const chemin = `otpChallenges/${uid}`;

  let defi;
  try {
    const doc = await firestoreGet(chemin, env);
    defi = fromFirestoreFields(doc.fields);
  } catch {
    throw httpError('Aucun code en cours. Demandez-en un nouveau.', 410);
  }

  if ((defi.expiresAt || 0) < Date.now()) {
    await firestoreDelete(chemin, env);
    throw httpError('Ce code a expiré. Demandez-en un nouveau.', 410);
  }

  // Décompté avant la comparaison, et atomiquement : sinon la limite ne
  // tient pas face à des tentatives simultanées.
  const essais = await firestoreIncrement(chemin, 'attempts', env);
  if (essais > MAX_ESSAIS) {
    await firestoreDelete(chemin, env);
    throw httpError('Trop de tentatives. Demandez un nouveau code.', 429);
  }

  const attendu = await sha256((defi.sel || '') + code);
  if (!memeCode(attendu, defi.codeHash || '')) {
    return json({
      ok: false,
      error: 'Code incorrect.',
      restant: Math.max(0, MAX_ESSAIS - essais)
    }, 401, cors);
  }

  // Bon code : usage unique, le défi disparaît avant toute suite.
  await firestoreDelete(chemin, env);

  /* L'attribut posé ici est ce que les règles Firestore exigent pour
     autoriser la moindre écriture. `a2fAuthTime` empêche la fuite entre
     appareils : un attribut personnalisé vaut pour tout jeton émis pour ce
     compte, alors que `auth_time` change à chaque vraie connexion.
     Comparer les deux dit que CE poste a bien saisi le code. */
  const jusqua = Date.now() + VALIDITE_ACCES_MS;
  await setCustomClaims(uid, { a2fUntil: jusqua, a2fAuthTime: authTime }, env);

  return json({ ok: true, a2fUntil: jusqua }, 200, cors);
}
