/**
 * Contact form — EmailJS integration
 *
 * Setup (one-time):
 *  1. Create a free account at https://emailjs.com
 *  2. Add an Email Service (Gmail, Outlook…) → copy the Service ID
 *  3. Create an Email Template with these variables:
 *       {{from_name}}, {{from_email}}, {{profile}}, {{property_link}}, {{message}}
 *     → copy the Template ID
 *  4. Go to Account → Public Key → copy it
 *  5. Fill in the three constants below
 */
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

export function initContact() {
    const form    = document.getElementById('contactForm');
    const btn     = form?.querySelector('.btn-submit');
    const success = document.getElementById('contact-success');
    const error   = document.getElementById('contact-error');

    if (!form || !btn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!EMAILJS_SERVICE_ID.startsWith('YOUR')) {
            await sendWithEmailJS(form, btn, success, error);
        } else {
            // Dev fallback — log payload and show success UI for testing layout
            const data = Object.fromEntries(new FormData(form));
            console.info('[Kazas] Form payload (EmailJS not configured yet):', data);
            showSuccess(form, btn, success, error);
        }
    });
}

async function sendWithEmailJS(form, btn, success, error) {
    setLoading(btn, true);
    hideMessages(success, error);

    const profile = form.querySelector('input[name="profile"]:checked')?.value ?? '';

    const params = {
        from_name:     form.querySelector('#name')?.value,
        from_email:    form.querySelector('#email')?.value,
        profile,
        property_link: form.querySelector('#link')?.value || '—',
    };

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, EMAILJS_PUBLIC_KEY);
        showSuccess(form, btn, success, error);
    } catch (err) {
        console.error('[Kazas] EmailJS error:', err);
        showError(btn, error);
    }
}

function setLoading(btn, on) {
    btn.disabled = on;
    btn.querySelector('.btn-label').classList.toggle('hidden', on);
    btn.querySelector('.btn-spinner').classList.toggle('hidden', !on);
}

function hideMessages(success, error) {
    success?.classList.add('hidden');
    error?.classList.add('hidden');
}

function showSuccess(form, btn, success, error) {
    setLoading(btn, false);
    hideMessages(success, error);
    form.reset();
    success?.classList.remove('hidden');
}

function showError(btn, error) {
    setLoading(btn, false);
    error?.classList.remove('hidden');
}
