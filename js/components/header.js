/**
 * Header Component
 * – Mobile menu toggle
 * – Header style switching via rAF-throttled scroll (passive) + cached positions
 *   → No per-scroll DOM reads → no main-thread blocking → burger clicks register instantly
 */
export function initHeader() {
    const navContainer = document.getElementById('mainNavContainer');
    const navLogo      = document.getElementById('navLogo');

    // ── Mobile menu ───────────────────────────────────────────────────────────
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            const expanded = menuButton.getAttribute('aria-expanded') === 'true';
            menuButton.setAttribute('aria-expanded', String(!expanded));
            mobileMenu.classList.toggle('hidden');
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuButton.setAttribute('aria-expanded', 'false');
            });
        });
    }

    if (!navContainer) return;

    // ── Style definitions ─────────────────────────────────────────────────────
    const STYLES = {
        hero: {
            add:    ['bg-transparent', 'text-white'],
            remove: ['bg-white/80', 'backdrop-blur-md', 'shadow-sm', 'text-primary'],
        },
        light: {
            add:    ['bg-white/80', 'backdrop-blur-md', 'shadow-sm', 'text-primary'],
            remove: ['bg-transparent', 'text-white'],
        },
        dark: {
            add:    ['bg-surface-dark/90', 'backdrop-blur-md', 'shadow-sm', 'text-white'],
            remove: ['bg-transparent', 'bg-white/80', 'text-primary'],
        },
    };

    function applyStyle(type) {
        const style = STYLES[type] || STYLES.hero;
        navContainer.classList.remove(...style.remove);
        navContainer.classList.add(...style.add);
        if (navLogo) {
            if (type === 'light') {
                navLogo.classList.remove('text-white');
                navLogo.classList.add('text-primary');
            } else {
                navLogo.classList.remove('text-primary');
                navLogo.classList.add('text-white');
            }
        }
    }

    // ── Cache section positions once — only re-read on resize ─────────────────
    // Never read from the DOM inside the scroll handler.
    const sectionEls = [...document.querySelectorAll('[data-header-style]')];
    let sectionCache = [];

    function cacheSections() {
        sectionCache = sectionEls.map(el => ({
            style:  el.dataset.headerStyle || 'hero',
            top:    Math.round(el.getBoundingClientRect().top + window.scrollY),
            height: el.offsetHeight,
        }));
    }

    // ── rAF-throttled scroll handler — passive so touch scroll is never blocked ─
    let ticking = false;

    function updateHeader() {
        const checkY = window.scrollY + 80; // 80px ≈ nav pill height
        let active = sectionCache.length ? sectionCache[0].style : 'hero';
        for (const s of sectionCache) {
            if (checkY >= s.top && checkY < s.top + s.height) {
                active = s.style;
                break;
            }
        }
        applyStyle(active);
        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    // Init
    cacheSections();
    updateHeader();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { cacheSections(); updateHeader(); }, { passive: true });
}
