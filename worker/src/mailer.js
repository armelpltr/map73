// ============================================================
// MAILER — envoi du code de double authentification, via Brevo
//
// Un seul message existe, celui du code. Tant que BREVO_API_KEY ou
// EMAIL_EXPEDITEUR manque, la fonction renvoie faux : l'appelant refuse
// alors la connexion plutôt que de prétendre avoir écrit.
//
// EMAIL_EXPEDITEUR doit être une adresse validée comme expéditeur chez
// Brevo (Senders → Add a sender → clic sur le lien de confirmation), sinon
// l'API accepte l'appel et le message n'arrive jamais.
// ============================================================

import { sansBOM } from './http.js';

const ENVOI = 'https://api.brevo.com/v3/smtp/email';

/* Les valeurs viennent du compte et du Worker, jamais de l'appelant, mais
   elles finissent dans du HTML : on échappe quand même. Une adresse e-mail
   contenant du balisage suffirait à casser le message. */
function echapper(texte) {
  return String(texte ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function corpsHtml(nom, code, minutes) {
  const bonjour = nom ? `Bonjour ${echapper(nom)},` : 'Bonjour,';
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f7f6f1;font-family:Georgia,'Times New Roman',serif;color:#14243b">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px">
    <p style="font-size:17px;line-height:1.6">${bonjour}</p>
    <p style="font-size:17px;line-height:1.6">Voici le code de connexion au panel du site MAP73&nbsp;:</p>
    <p style="font-family:Consolas,Menlo,monospace;font-size:38px;font-weight:700;letter-spacing:.22em;margin:28px 0;color:#1c6e3d">${echapper(code)}</p>
    <p style="font-size:15px;line-height:1.6;color:#4a5872">Il est valable ${minutes}&nbsp;minutes et ne sert qu'une fois.</p>
    <p style="font-size:15px;line-height:1.6;color:#4a5872">Si vous n'êtes pas à l'origine de cette connexion, ne saisissez pas ce code et changez votre mot de passe.</p>
  </div>
</body></html>`;
}

export async function envoyerCodeA2F({ email, nom, code, minutes = 10 }, env) {
  const cle = sansBOM(env.BREVO_API_KEY);
  if (!cle || !env.EMAIL_EXPEDITEUR) {
    console.error('[mailer] Brevo non configure : aucun code ne peut partir');
    return false;
  }

  try {
    const res = await fetch(ENVOI, {
      method: 'POST',
      headers: {
        'api-key': cle,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        sender: { email: env.EMAIL_EXPEDITEUR, name: env.EMAIL_EXPEDITEUR_NOM || 'MAP73' },
        to: [{ email }],
        subject: `Code de connexion MAP73 : ${code}`,
        htmlContent: corpsHtml(nom, code, minutes),
        textContent: `Code de connexion au panel MAP73 : ${code}\nValable ${minutes} minutes, à usage unique.`
      })
    });

    if (!res.ok) {
      console.error('[mailer] Brevo a refuse :', res.status, await res.text());
      return false;
    }
    return true;
  } catch (erreur) {
    console.error('[mailer] envoi impossible :', erreur);
    return false;
  }
}
