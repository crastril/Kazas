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
});
