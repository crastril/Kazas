export function initPaywall() {
    const modal    = document.getElementById('paywall-modal');
    const backdrop = document.getElementById('paywall-backdrop');
    const closeBtn = document.getElementById('paywall-close');
    const form     = document.getElementById('auditForm');
    const formSec  = document.getElementById('paywall-form-section');
    const success  = document.getElementById('paywall-success');
    const errDiv   = document.getElementById('audit-error');

    if (!modal) return;

    // Open triggers: all buttons with id "unlock-audit-btn" or "unlock-audit-btn-2"
    document.querySelectorAll('#unlock-audit-btn, #unlock-audit-btn-2').forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    function openModal() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    if (!form) return;

    const submitBtn = form.querySelector('.btn-audit-submit');
    const labelEl   = form.querySelector('.btn-audit-label');
    const spinnerEl = form.querySelector('.btn-audit-spinner');

    form.addEventListener('submit', async e => {
        e.preventDefault();
        setLoading(true);
        errDiv?.classList.add('hidden');

        const simData = window._kazasSimData || {};

        const payload = {
            from_name:  document.getElementById('audit-name')?.value,
            from_email: document.getElementById('audit-email')?.value,
            phone:      document.getElementById('audit-phone')?.value,
            airbnb_url: document.getElementById('audit-url')?.value || '',
            sim_data:   JSON.stringify(simData),
        };

        try {
            const res = await fetch('/api/create-checkout', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());

            const { url } = await res.json();
            window.location.href = url;
        } catch (err) {
            console.error('[Kazas] Checkout error:', err);
            errDiv?.classList.remove('hidden');
            errDiv?.classList.add('flex');
            setLoading(false);
        }
    });

    function setLoading(on) {
        if (submitBtn) submitBtn.disabled = on;
        labelEl?.classList.toggle('hidden', on);
        spinnerEl?.classList.toggle('hidden', !on);
        spinnerEl?.classList.toggle('flex', on);
    }
}
