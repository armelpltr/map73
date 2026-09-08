// ============================================================
// POST /connexion — la porte du panel
//
// Le navigateur ne s'adresse plus directement à Firebase pour se connecter.
// Il passe ici, et trois conditions doivent tomber dans cet ordre :
//
//   1. le jeton Turnstile est valide — sinon c'est un robot ;
//   2. l'adresse correspond à un compte inscrit dans `admins` — un compte
//      Firebase qui n'y figure pas n'obtient rien, et on ne va même pas
//      jusqu'à regarder son mot de passe ;
//   3. le mot de passe est le bon.
//
// Seulement alors le Worker signe un jeton personnalisé, que le navigateur
// échange contre une session. Le mot de passe ne sert donc jamais à ouvrir
// une session directement.
//
// Une réserve à garder en tête, et qui est la raison d'être d'App Check :
// l'API publique d'Identity Toolkit reste joignable avec la clé web du
// site. Quelqu'un peut toujours s'y créer un compte ou s'y connecter sans
// passer par ici — mais la session obtenue ne vaut rien : les règles
// Firestore exigent une entrée dans `admins` ET la double authentification,
// que seul ce Worker peut poser.
// ============================================================

import { json, httpError } from './http.js';
import { verifierTurnstile } from './turnstile.js';
import {
  findAuthUserByEmail, firestoreGet, fromFirestoreFields,
  verifierMotDePasse, createCustomToken
} from './firebase.js';

/* Un seul message pour « compte inconnu », « non inscrit » et « mauvais mot
   de passe » : distinguer les cas dirait à un inconnu quelles adresses ont
   un accès au panel. */
const REFUS = 'Adresse e-mail ou mot de passe incorrect.';

export async function handleConnexion(request, env, cors) {
  const body = await request.json().catch(() => {
    throw httpError('Requête illisible.', 400);
  });

  const email = String(body.email ?? '').trim().toLowerCase();
  const motDePasse = String(body.motDePasse ?? '');

  await verifierTurnstile(body.turnstile, request, env);

  if (!email || !motDePasse) throw httpError(REFUS, 401);

  const compte = await findAuthUserByEmail(email, env);
  if (!compte) {
    /* TEMPORAIRE — mise au point de la premiere connexion. L'adresse recue
       est journalisee pour la comparer a celle du compte : une difference
       d'une lettre suffit, et le refus generique ne le dit pas. A retirer
       une fois le premier acces ouvert. */
    console.log(`[connexion] adresse inconnue : ${email}`);
    throw httpError(REFUS, 401);
  }

  let membre = null;
  try {
    const doc = await firestoreGet(`admins/${compte.localId}`, env);
    membre = fromFirestoreFields(doc.fields);
  } catch { /* absent de `admins` */ }

  if (!membre) {
    /* L'UID est journalisé pour pouvoir le comparer à l'identifiant du
       document `admins` : la confusion la plus courante est un document créé
       avec un identifiant automatique au lieu de l'UID du compte. Un UID
       n'est pas un secret, et ces journaux ne sont lisibles que par le
       titulaire du compte Cloudflare. */
    console.log(`[connexion] compte hors de admins — uid attendu : ${compte.localId}`);
    throw httpError(REFUS, 401);
  }
  if (membre.actif === false) {
    throw httpError('Cet accès a été suspendu. Contactez l’administrateur du site.', 403);
  }

  const verdict = await verifierMotDePasse(email, motDePasse, env);
  if (verdict.bloque) {
    throw httpError('Trop de tentatives. Réessayez dans quelques minutes.', 429);
  }
  if (!verdict.ok) {
    console.log('[connexion] mot de passe refuse');
    throw httpError(REFUS, 401);
  }

  const jeton = await createCustomToken(compte.localId, env);
  return json({ ok: true, jeton, nom: membre.nom || '', role: membre.role || 'editeur' }, 200, cors);
}
