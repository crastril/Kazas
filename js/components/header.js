/**
 * Header Component Logic
 * Handles scroll effects, mobile menu toggling, and responsive adaptability.
 */
export function initHeader() {
    const header = document.querySelector('header');
    const navContainer = document.getElementById('mainNavContainer');
    const navLogo = document.getElementById('navLogo');

    // Define styles for different section types
    const headerStyles = {
        hero: {
            // Transparent background, White text
            add: ['bg-transparent', 'text-white'],
            remove: ['bg-white/80', 'backdrop-blur-md', 'shadow-sm', 'text-primary']
        },
        light: {
            // White/Blurred background, Dark text
            add: ['bg-white/80', 'backdrop-blur-md', 'shadow-sm', 'text-primary'],
            remove: ['bg-transparent', 'text-white']
        },
        dark: {
            // Darker/Blurred background, White text
            add: ['bg-surface-dark/90', 'backdrop-blur-md', 'shadow-sm', 'text-white'],
            remove: ['bg-transparent', 'bg-white/80', 'text-primary']
        }
    };

    const sections = document.querySelectorAll('section, header, footer');

    function updateHeader() {
        const scrollPosition = window.scrollY + 100; // Check point slightly below top
        let currentSection = null;

        // Find the current section
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSection = section;
            }
        });

        // Default to hero if no section found
        const styleType = currentSection ? (currentSection.dataset.headerStyle || 'hero') : 'hero';
        const style = headerStyles[styleType];

        if (style && navContainer) {
            navContainer.classList.remove(...style.remove);
            navContainer.classList.add(...style.add);

            if (navLogo) {
                if (styleType === 'light') {
                    navLogo.classList.remove('text-white');
                    navLogo.classList.add('text-primary');
                } else {
                    navLogo.classList.remove('text-primary');
                    navLogo.classList.add('text-white');
                }
            }
        }
    }

    if (header && navContainer) {
        // Mobile Menu Logic
        const menuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');

        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
                menuButton.setAttribute('aria-expanded', !isExpanded);
                mobileMenu.classList.toggle('hidden');
            });

            // Close mobile menu on link click
            const mobileLinks = mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    menuButton.setAttribute('aria-expanded', 'false');
                });
            });
        }

        window.addEventListener('scroll', updateHeader);
        updateHeader(); // Initial check
    }
}
