export function initContact() {
    const form    = document.getElementById('contactForm');
    const btn     = form?.querySelector('.btn-submit');
    const success = document.getElementById('contact-success');
    const error   = document.getElementById('contact-error');

    if (!form || !btn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(btn, true);
        hideMessages(success, error);

        const payload = {
            from_name:     form.querySelector('#name')?.value,
            from_email:    form.querySelector('#email')?.value,
            profile:       form.querySelector('input[name="profile"]:checked')?.value ?? '',
            property_link: form.querySelector('#link')?.value || '',
        };

        try {
            const res = await fetch('/api/contact', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());

            form.reset();
            showSuccess(btn, success, error);
        } catch (err) {
            console.error('[Kazas] Contact error:', err);
            showError(btn, error);
        }
    });
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

function showSuccess(btn, success, error) {
    setLoading(btn, false);
    hideMessages(success, error);
    success?.classList.remove('hidden');
}

function showError(btn, error) {
    setLoading(btn, false);
    error?.classList.remove('hidden');
}
