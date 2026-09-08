// ============================================================
// HTTP — réponses et erreurs partagées par les routes
// ============================================================

export function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    /* `X-Dossier` porte le dossier de destination d'une photo. Un en-tête
       absent de cette liste fait échouer le préflight, et le navigateur
       n'envoie jamais la requête : l'import remontait « connexion
       impossible », alors que rien n'était parti. */
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Dossier',
    'Access-Control-Max-Age': '86400',
  };
}

export function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

export function httpError(message, status) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/*
 * Les secrets injectes par `wrangler secret put` peuvent arriver precedes
 * d'un BOM : PowerShell en ajoute un quand il redirige de l'UTF-8 vers un
 * executable natif. Le caractere est invisible, mais il casse tout ce qui
 * suit — JSON.parse echouait sur le compte de service, et Brevo repondait
 * « Key not found » sur une cle pourtant valide. On nettoie a la lecture,
 * une fois pour toutes, plutot que de dependre de la facon dont le secret
 * a ete saisi.
 */
export function sansBOM(valeur) {
  return String(valeur ?? '').replace(/^﻿/, '').trim();
}
