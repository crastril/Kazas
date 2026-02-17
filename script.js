// Initialize Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://uzmjbsbcyuyyojrfvfjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bWpic2JjeXV5eW9qcmZ2Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjI3NTYsImV4cCI6MjA4NTg5ODc1Nn0.4f3WtQekREYO5FT79N_tulLKC7r9Eth_bgutkC1l9qY'
const supabase = createClient(supabaseUrl, supabaseKey)

document.addEventListener('DOMContentLoaded', () => {
    // Form handling
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form values
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML; // Using innerHTML to preserve icon

            submitBtn.innerHTML = 'Envoi en cours...';
            submitBtn.disabled = true;

            try {
                const { error } = await supabase
                    .from('messages')
                    .insert([
                        {
                            name: data.name,
                            email: data.email,
                            profile: data.profile,
                            property_link: data.property_link
                            // message is not in the form anymore, relying on profile/link as contact info
                        }
                    ]);

                if (error) throw error;

                // Success state
                alert(`Merci ${data.name} ! Votre demande d'audit a bien été reçue. Nous vous recontacterons bientôt.`);
                contactForm.reset();

            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Smooth scrolling for anchor links is handled by CSS scroll-behavior: smooth in Stitch design
    // Keeping this for older browsers just in case, but simplifying it
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple fade-in animation on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.feature-card, .contact-info, .contact-form');

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Dynamic Header Visibility based on Sections
    const navContainer = document.getElementById('mainNavContainer');
    const navLogo = navContainer ? navContainer.querySelector('a') : null;
    const navLinksContainer = navContainer ? navContainer.querySelector('div.hidden') : null;
    const navLinks = navLinksContainer ? navLinksContainer.querySelectorAll('a') : [];

    if (navContainer && navLogo) {
        const sections = document.querySelectorAll('[data-header-style]');

        // Define styles for each state
        const headerStyles = {
            hero: {
                add: ['glass-morphism', 'border-white/20', 'text-white', 'shadow-glass'],
                remove: ['bg-surface-dark/95', 'backdrop-blur-md', 'border-white/5', 'text-primary', 'shadow-2xl', 'border-primary/10']
            },
            dark: {
                add: ['bg-surface-dark/95', 'backdrop-blur-md', 'border-white/5', 'text-white', 'shadow-2xl'],
                remove: ['glass-morphism', 'border-white/20', 'text-primary', 'shadow-glass', 'border-primary/10']
            },
            light: {
                add: ['glass-morphism', 'border-primary/10', 'text-primary', 'shadow-glass'],
                remove: ['bg-surface-dark/95', 'backdrop-blur-md', 'border-white/5', 'text-white', 'shadow-2xl', 'border-white/20']
            }
        };

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

            // Default to hero if no section found (e.g. very top)
            const styleType = currentSection ? currentSection.dataset.headerStyle : 'hero';
            const style = headerStyles[styleType];

            if (style) {
                navContainer.classList.remove(...style.remove);
                navContainer.classList.add(...style.add);

                // Update Logo specifically if needed (though text-color on container handles most)
                if (styleType === 'light') {
                    navLogo.classList.remove('text-white');
                    navLogo.classList.add('text-primary');
                } else {
                    navLogo.classList.remove('text-primary');
                    navLogo.classList.add('text-white');
                }
            }
        }

        window.addEventListener('scroll', updateHeader);
        // Initial check
        updateHeader();
    }

    // SIMULATOR LOGIC
    const simRooms = document.getElementById('sim-rooms');
    const simRoomsValue = document.getElementById('sim-rooms-value');
    const simEquipment = document.getElementById('sim-equipment');
    const simEquipmentValue = document.getElementById('sim-equipment-value');
    const simPool = document.getElementById('sim-pool');
    const simView = document.getElementById('sim-view');
    const simDecorationValue = document.getElementById('sim-decoration-value');
    const simDecorationYes = document.getElementById('sim-decoration-yes');
    const simDecorationNo = document.getElementById('sim-decoration-no');
    const simDecorationInput = document.getElementById('sim-decoration');
    const simPhotosValue = document.getElementById('sim-photos-value');
    const simPhotosYes = document.getElementById('sim-photos-yes');
    const simPhotosNo = document.getElementById('sim-photos-no');
    const simPhotosInput = document.getElementById('sim-photos');

    const simRevenueDisplay = document.getElementById('sim-revenue-display');
    const simMarketDisplay = document.getElementById('sim-market-display');
    const simRevenueBar = document.getElementById('sim-revenue-bar');
    const simMarketBar = document.getElementById('sim-market-bar');

    if (simRooms && simRevenueDisplay) {

        const equipmentLabels = { '1': 'Standard', '2': 'Premium', '3': 'Luxe' };

        function updateSimulator() {
            // Get Values
            const rooms = parseInt(simRooms.value);
            const equipment = parseInt(simEquipment.value);
            const hasPool = simPool.checked;
            const hasView = simView.checked;
            const hasDecoration = simDecorationInput.value === 'true';
            const hasPhotos = simPhotosInput.value === 'true';

            // Update Labels
            simRoomsValue.textContent = rooms;
            simEquipmentValue.textContent = equipmentLabels[equipment];
            simDecorationValue.textContent = hasDecoration ? 'Oui' : 'Non';
            simPhotosValue.textContent = hasPhotos ? 'Oui' : 'Non';

            // Calculate Revenue
            let baseRevenue = 25000 + (rooms * 12000); // Base + Room Value

            // Equipment Multiplier
            const equipmentMultipliers = { 1: 1, 2: 1.25, 3: 1.6 };
            baseRevenue *= equipmentMultipliers[equipment];

            // Add-ons
            if (hasPool) baseRevenue += 15000;
            if (hasView) baseRevenue += 10000;

            // Multipliers
            if (hasDecoration) baseRevenue *= 1.15;
            if (hasPhotos) baseRevenue *= 1.10;

            // Final Calculation
            const optimizedRevenue = Math.round(baseRevenue);
            // Market is usually lower, let's say Kazas adds ~25% value, so Market is Revenue / 1.25
            const marketRevenue = Math.round(optimizedRevenue / 1.25);

            // Display Values
            simRevenueDisplay.textContent = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(optimizedRevenue);
            simMarketDisplay.textContent = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(marketRevenue);

            // Update Bars (Visual representation)
            // Max potential revenue for bar scaling (approx max possible value)
            const maxPotential = 350000;
            const revenuePercentage = Math.min((optimizedRevenue / maxPotential) * 100, 100);
            const marketPercentage = Math.min((marketRevenue / maxPotential) * 100, 100);

            simRevenueBar.style.height = `${revenuePercentage}%`;
            simMarketBar.style.height = `${marketPercentage}%`;
        }

        // Event Listeners
        simRooms.addEventListener('input', updateSimulator);
        simEquipment.addEventListener('input', updateSimulator);
        simPool.addEventListener('change', updateSimulator);
        simView.addEventListener('change', updateSimulator);

        // Toggle Decoration
        simDecorationYes.addEventListener('click', () => {
            simDecorationInput.value = 'true';
            updateClasses(simDecorationYes, simDecorationNo, true);
            updateSimulator();
        });
        simDecorationNo.addEventListener('click', () => {
            simDecorationInput.value = 'false';
            updateClasses(simDecorationYes, simDecorationNo, false);
            updateSimulator();
        });

        // Toggle Photos
        simPhotosYes.addEventListener('click', () => {
            simPhotosInput.value = 'true';
            updateClasses(simPhotosYes, simPhotosNo, true);
            updateSimulator();
        });
        simPhotosNo.addEventListener('click', () => {
            simPhotosInput.value = 'false';
            updateClasses(simPhotosYes, simPhotosNo, false);
            updateSimulator();
        });

        function updateClasses(btnYes, btnNo, isYes) {
            if (isYes) {
                btnYes.classList.remove('bg-white/5', 'text-white/60', 'hover:bg-white/10');
                btnYes.classList.add('bg-gold', 'text-primary', 'font-bold', 'shadow-neon');

                btnNo.classList.remove('bg-gold', 'text-primary', 'font-bold', 'shadow-neon');
                btnNo.classList.add('bg-white/5', 'text-white/60', 'hover:bg-white/10');
            } else {
                btnNo.classList.remove('bg-white/5', 'text-white/60', 'hover:bg-white/10');
                btnNo.classList.add('bg-gold', 'text-primary', 'font-bold', 'shadow-neon');

                btnYes.classList.remove('bg-gold', 'text-primary', 'font-bold', 'shadow-neon');
                btnYes.classList.add('bg-white/5', 'text-white/60', 'hover:bg-white/10');
            }
        }

        // Initialize
        updateSimulator();
    }
});
