// ============================================================
// map73-worker — routeur
//
// Ce que le navigateur ne peut pas faire seul :
//   POST /connexion       vérifier le contrôle anti-robot, l'appartenance
//                         à `admins` puis le mot de passe, et ne rendre une
//                         session que si les trois passent
//   POST /a2f/request     tirer un code à six chiffres et l'envoyer par
//                         e-mail, sans qu'il transite par le navigateur
//   POST /a2f/verify      le vérifier et poser l'attribut que les règles
//                         Firestore exigent pour toute écriture
//   POST /membres         lister les accès au panel
//   POST /membres/creer   créer un accès
//   POST /membres/retirer le supprimer
//
// Toutes passent par la clé de service, qui ne peut pas vivre dans du
// JavaScript servi aux visiteurs. Ce Worker est le seul endroit où elle est
// à l'abri — et, corollaire à ne jamais perdre de vue, le seul que les
// règles Firestore ne protègent pas : elle les contourne. Chaque route
// refait donc les vérifications elle-même, via membre.js.
// ============================================================

import { corsHeaders, json } from './http.js';
import { handleConnexion } from './connexion.js';
import { handleA2fRequest, handleA2fVerify } from './a2f.js';
import { handleMembresListe, handleMembreCreer, handleMembreRetirer } from './membres.js';

const ROUTES = {
  '/connexion': handleConnexion,
  '/a2f/request': handleA2fRequest,
  '/a2f/verify': handleA2fVerify,
  '/membres': handleMembresListe,
  '/membres/creer': handleMembreCreer,
  '/membres/retirer': handleMembreRetirer
};

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    const chemin = new URL(request.url).pathname;

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const handler = ROUTES[chemin];
    if (!handler) return json({ error: 'Not found' }, 404, cors);
    if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405, cors);

    try {
      return await handler(request, env, cors);
    } catch (err) {
      const status = err.status || 500;
      // Les messages métier sont écrits pour être lus par l'utilisateur ;
      // une erreur inattendue ne doit pas laisser fuiter le détail interne.
      const message = err.status ? err.message : 'Erreur serveur';
      if (!err.status) console.error('Erreur non gérée :', err);
      return json({ error: message }, status, cors);
    }
  }
};
