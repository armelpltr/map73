// ============================================================
// TURNSTILE — contrôle anti-robot devant la connexion au panel
//
// Le formulaire de connexion est la seule porte publique du panel. Sans
// contrôle, c'est un endpoint d'essai de mots de passe ouvert à tout
// Internet. Le jeton est produit par le widget dans le navigateur et ne
// vaut que vérifié ici, côté serveur, avec la clé secrète.
//
// Sans TURNSTILE_SECRET, la connexion est refusée : mieux vaut un panel
// injoignable qu'une porte sans serrure.
// ============================================================

import { httpError, sansBOM } from './http.js';

const VERIFICATION = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifierTurnstile(jeton, request, env) {
  const secret = sansBOM(env.TURNSTILE_SECRET);
  if (!secret) {
    throw httpError('Contrôle anti-robot non configuré. Prévenez l’administrateur du site.', 503);
  }
  if (!jeton || typeof jeton !== 'string') {
    throw httpError('Contrôle anti-robot manquant. Rechargez la page.', 400);
  }

  const corps = new FormData();
  corps.append('secret', secret);
  corps.append('response', jeton);

  // L'IP du visiteur renforce la vérification côté Cloudflare.
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) corps.append('remoteip', ip);

  const res = await fetch(VERIFICATION, { method: 'POST', body: corps });
  const resultat = await res.json().catch(() => ({}));

  if (!resultat.success) {
    console.log('[turnstile] refus :', JSON.stringify(resultat['error-codes'] || []));
    throw httpError('Contrôle anti-robot échoué. Rechargez la page et réessayez.', 403);
  }
}
