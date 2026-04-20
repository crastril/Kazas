import { Resend } from 'resend';

const resend   = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Kazas <hello@kazasfwi.com>';
const TO_EMAIL   = 'hello@kazasfwi.com';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { from_name, from_email, phone, airbnb_url, sim_data } = req.body;

    if (!from_name || !from_email || !phone) {
        return res.status(400).json({ error: 'Nom, email et téléphone requis.' });
    }

    // Parse simulator data for display in email
    let simSummary = '—';
    try {
        const d = JSON.parse(sim_data || '{}');
        if (d.monthly_min && d.monthly_max) {
            simSummary = `Zone: ${d.zone || '?'} | ${d.bedrooms || '?'} ch. | Piscine: ${d.private_pool ? 'Oui' : 'Non'} | Potentiel: ${d.monthly_min}€ – ${d.monthly_max}€ /mois`;
        }
    } catch (_) {}

    try {
        await resend.emails.send({
            from:    FROM_EMAIL,
            to:      TO_EMAIL,
            replyTo: from_email,
            subject: `🔑 Demande Audit Pro — ${from_name}`,
            html: `
                <h2 style="color:#D4AF37">Nouvelle demande d'Audit Pro (79€)</h2>
                <table cellpadding="10" style="border-collapse:collapse;font-family:sans-serif;">
                    <tr><td><strong>Nom</strong></td><td>${from_name}</td></tr>
                    <tr><td><strong>Email</strong></td><td><a href="mailto:${from_email}">${from_email}</a></td></tr>
                    <tr><td><strong>Téléphone</strong></td><td>${phone}</td></tr>
                    <tr><td><strong>URL Airbnb</strong></td><td>${airbnb_url || '—'}</td></tr>
                    <tr><td><strong>Simulateur</strong></td><td>${simSummary}</td></tr>
                </table>
                <p style="margin-top:20px;color:#666;font-size:12px;">À contacter sous 48h avec le lien de paiement Stripe.</p>
            `,
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[Kazas] Audit Resend error:', err);
        return res.status(500).json({ error: 'Erreur envoi email.' });
    }
}
