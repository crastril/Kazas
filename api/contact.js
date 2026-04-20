import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Kazas <hello@kazasfwi.com>';
const TO_EMAIL   = 'hello@kazasfwi.com';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { from_name, from_email, profile, property_link } = req.body;

    if (!from_name || !from_email) {
        return res.status(400).json({ error: 'Nom et email requis.' });
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to:   TO_EMAIL,
            replyTo: from_email,
            subject: `Nouvelle demande — ${profile || 'Propriétaire'} — ${from_name}`,
            html: `
                <h2>Nouvelle demande d'estimation</h2>
                <table cellpadding="8" style="border-collapse:collapse;">
                    <tr><td><strong>Nom</strong></td><td>${from_name}</td></tr>
                    <tr><td><strong>Email</strong></td><td>${from_email}</td></tr>
                    <tr><td><strong>Profil</strong></td><td>${profile || '—'}</td></tr>
                    <tr><td><strong>Lien du bien</strong></td><td>${property_link || '—'}</td></tr>
                </table>
            `,
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[Kazas] Resend error:', err);
        return res.status(500).json({ error: 'Erreur envoi email.' });
    }
}
