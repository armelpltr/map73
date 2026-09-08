// ============================================================
// CONFIG — points d'entrée externes du panel
//
// Rien ici n'est secret : le navigateur appelle ces adresses, elles sont
// publiques par construction. Elles vivent au même endroit pour qu'un
// changement de domaine ne laisse pas une copie oubliée derrière lui.
// ============================================================

/* Le Worker tient la porte du panel : contrôle anti-robot, appartenance à
   `admins`, mot de passe, puis code à six chiffres. Il détient la clé de
   service, seul endroit où elle peut vivre sans être publique. */
export const WORKER_URL = "https://map73-worker.armelpltr14-ad6.workers.dev";

/* Clé publique du widget Turnstile (dash.cloudflare.com > Turnstile).
   La clé secrète, elle, ne vit que dans le Worker.
   Tant qu'elle n'est pas renseignée, la connexion est refusée côté
   serveur : le panel le dit plutôt que de laisser essayer. */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAEtCOjBRUTPe-YPp_ycYYtkVsok";
