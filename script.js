// Main Initialization Function
function init() {
    // HEADER SCROLL EFFECT & LOGIC
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

    // New Logic: Check current section in view
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

        // Default to hero if no section found (e.g. very top)
        const styleType = currentSection ? (currentSection.dataset.headerStyle || 'hero') : 'hero';
        const style = headerStyles[styleType];

        if (style && navContainer) {
            navContainer.classList.remove(...style.remove);
            navContainer.classList.add(...style.add);

            // Update Logo specifically if needed (though text-color on container handles most)
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
        // Mobile Menu Toggle (Keep existing logic if any, or add basic toggle)
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
        // Initial check
        updateHeader();
    }

    // SIMULATOR LOGIC
    // SIMULATOR LOGIC
    const simRooms = document.getElementById('sim-rooms');
    const simRoomsValue = document.getElementById('sim-rooms-value');
    const simCapacity = document.getElementById('sim-capacity');
    const simCapacityValue = document.getElementById('sim-capacity-value');
    const simEquipment = document.getElementById('sim-equipment');
    const simEquipmentValue = document.getElementById('sim-equipment-value');
    const simPool = document.getElementById('sim-pool');
    const simView = document.getElementById('sim-view');
    const simMultiSite = document.getElementById('sim-multisite');
    const simOptimizedListing = document.getElementById('sim-optimized-listing');
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


    // New Detail Elements
    const simPriceStandard = document.getElementById('sim-price-standard');
    const simOccupancyStandard = document.getElementById('sim-occupancy-standard');
    const simPriceKazas = document.getElementById('sim-price-kazas');
    const simOccupancyKazas = document.getElementById('sim-occupancy-kazas');
    const simImpactsList = document.getElementById('sim-impacts-list'); // New list container

    if (simRooms && simRevenueDisplay) {

        const equipmentLabels = { '1': 'Standard', '2': 'Premium', '3': 'Luxe' };

        function updateSliderFill(slider) {
            const val = (slider.value - slider.min) / (slider.max - slider.min) * 100;
            slider.style.background = `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${val}%, rgba(255, 255, 255, 0.1) ${val}%, rgba(255, 255, 255, 0.1) 100%)`;
        }

        function updateSimulator() {
            // Get Values
            const rooms = parseInt(simRooms.value);
            const capacity = parseInt(simCapacity.value);
            const equipment = parseInt(simEquipment.value);
            const hasPool = simPool.checked;
            const hasView = simView.checked;
            const hasDecoration = simDecorationInput.value === 'true';
            const hasMultiSite = simMultiSite ? simMultiSite.checked : false;
            const hasOptimizedListing = simOptimizedListing ? simOptimizedListing.checked : false;
            const hasPhotos = simPhotosInput.value === 'true';

            // Update Labels & Visuals
            simRoomsValue.textContent = rooms;
            simCapacityValue.textContent = capacity;
            simEquipmentValue.textContent = equipmentLabels[equipment];
            simDecorationValue.textContent = hasDecoration ? 'Oui' : 'Non';
            simPhotosValue.textContent = hasPhotos ? 'Oui' : 'Non';

            updateSliderFill(simRooms);
            updateSliderFill(simCapacity);
            updateSliderFill(simEquipment);

            // --- Calculation Logic (Martinique Market) ---

            // Base Price Formula (reduced to match real market)
            let basePrice = (rooms * 40) + (capacity * 8);

            // 1. Standard (Sans Kazas) Calculation
            const equipmentPriceMultipliers = { 1: 1, 2: 1.10, 3: 1.20 };
            let standardPrice = basePrice * equipmentPriceMultipliers[equipment];

            let standardOccupancy = 0.30;
            if (equipment === 2) standardOccupancy += 0.02;
            if (equipment === 3) standardOccupancy += 0.04;
            standardOccupancy = Math.min(standardOccupancy, 0.40);

            // 2. Optimized (Avec Kazas) — Proportional Occupancy Redistribution
            let optimizedPrice = standardPrice;
            let impacts = [];

            // Collect all occupancy boosts with labels
            const occBoosts = [];

            // Kazas Expertise baseline
            occBoosts.push({ label: "Gestion Kazas", rawBoost: 0.10, detail: "" });

            // Piscine
            if (hasPool) {
                const poolPrice = 30 + (rooms * 8);
                optimizedPrice += poolPrice;
                occBoosts.push({ label: "Piscine", rawBoost: 0.04, detail: `+${Math.round(poolPrice)}€ Prix` });
            }

            // Vue Dégagée
            if (hasView) {
                const viewPrice = 12 + (rooms * 2);
                optimizedPrice += viewPrice;
                occBoosts.push({ label: "Vue Mer/Dégagée", rawBoost: 0.03, detail: `+${Math.round(viewPrice)}€ Prix` });
            }

            // Multi-sites
            if (hasMultiSite) {
                occBoosts.push({ label: "Multi-sites", rawBoost: 0.08, detail: "" });
            }

            // Annonce Optimisée
            if (hasOptimizedListing) {
                occBoosts.push({ label: "Annonce Opti.", rawBoost: 0.05, detail: "" });
            }

            // Decoration
            if (hasDecoration) {
                const priceBoost = optimizedPrice * 0.10;
                optimizedPrice += priceBoost;
                occBoosts.push({ label: "Déco Pro", rawBoost: 0.04, detail: "+10% Prix" });
            }

            // Photos Pro
            if (hasPhotos) {
                occBoosts.push({ label: "Photos Pro", rawBoost: 0.15, detail: "" });
            }

            // --- Proportional Redistribution ---
            const MAX_OCCUPANCY = 0.40;
            const headroom = MAX_OCCUPANCY - standardOccupancy;
            const totalRawBoost = occBoosts.reduce((sum, b) => sum + b.rawBoost, 0);
            const scaleFactor = totalRawBoost > headroom ? headroom / totalRawBoost : 1;

            let optimizedOccupancy = standardOccupancy;
            occBoosts.forEach(boost => {
                const actualBoost = boost.rawBoost * scaleFactor;
                optimizedOccupancy += actualBoost;
                const actualPct = Math.round(actualBoost * 100);

                // Build impact detail
                let detail = boost.detail;
                if (actualPct > 0) {
                    const occText = `+${actualPct}% Occup.`;
                    detail = detail ? `${detail} / ${occText}` : occText;
                }

                if (boost.label !== "Gestion Kazas" && detail) {
                    impacts.push({ label: boost.label, detail });
                }
            });

            // Equipment Upgrade highlight
            if (equipment > 1) {
                const label = equipment === 2 ? "Premium" : "Luxe";
                impacts.push({ label: `Équip. ${label}`, detail: "Base + solide" });
            }

            // Yield Management (reduced impact)
            optimizedPrice *= 1.03;

            // Cap (should already be ≤70% thanks to redistribution, safety net)
            optimizedOccupancy = Math.min(optimizedOccupancy, MAX_OCCUPANCY);

            // 3. Seasonality & Monthly Revenue
            // Martinique High Seasons: Dec-Apr (winter), Jul-Sep (summer)
            // Low seasons: May-Jun, Oct-Nov
            const seasonCoeffs = [1.4, 1.5, 1.3, 1.2, 0.7, 0.65, 1.1, 1.15, 0.95, 0.75, 0.85, 1.45];

            // Different occupancy patterns: Standard is more erratic, Kazas is more stable
            const standardOccCoeffs = [1.1, 1.15, 1.05, 1.0, 0.75, 0.70, 1.0, 1.05, 0.85, 0.70, 0.80, 1.2];
            const kazasOccCoeffs = [1.15, 1.2, 1.12, 1.08, 0.85, 0.80, 1.1, 1.15, 0.95, 0.85, 0.90, 1.25];

            const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            const monthlyStandard = [];
            const monthlyOptimized = [];
            let standardRevenue = 0;
            let optimizedRevenue = 0;

            for (let i = 0; i < 12; i++) {
                const priceCoeff = seasonCoeffs[i];
                const stdOccCoeff = standardOccCoeffs[i];
                const kazOccCoeff = kazasOccCoeffs[i];
                const days = daysPerMonth[i];

                // Standard: price varies by season, occupancy fluctuates
                const stdMonthly = Math.round(standardPrice * priceCoeff * days * standardOccupancy * stdOccCoeff);
                // Kazas: better price + better occupancy stability
                const optMonthly = Math.round(optimizedPrice * priceCoeff * days * optimizedOccupancy * kazOccCoeff);

                monthlyStandard.push(stdMonthly);
                monthlyOptimized.push(optMonthly);
                standardRevenue += stdMonthly;
                optimizedRevenue += optMonthly;
            }

            // --- Display ---
            simRevenueDisplay.textContent = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(optimizedRevenue);
            simMarketDisplay.textContent = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(standardRevenue);

            if (simPriceStandard) simPriceStandard.textContent = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(standardPrice);
            if (simOccupancyStandard) simOccupancyStandard.textContent = `${Math.round(standardOccupancy * 100)}%`;

            if (simPriceKazas) simPriceKazas.textContent = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(optimizedPrice);
            if (simOccupancyKazas) simOccupancyKazas.textContent = `${Math.round(optimizedOccupancy * 100)}%`;

            // Display Impacts List
            if (simImpactsList) {
                simImpactsList.innerHTML = '';
                impacts.forEach(impact => {
                    const li = document.createElement('li');
                    li.className = "flex justify-between items-center text-[10px] text-white/80";
                    li.innerHTML = `<span>${impact.label}</span> <span class="font-bold text-gold bg-gold/10 px-1 rounded">${impact.detail}</span>`;
                    simImpactsList.appendChild(li);
                });
                if (impacts.length === 0) {
                    simImpactsList.innerHTML = '<li class="text-[10px] text-white/40 italic">Aucune option</li>';
                }
            }

            // --- Monthly Bar Chart ---
            const chartContainer = document.getElementById('sim-monthly-chart');
            if (chartContainer) {
                const maxMonthly = Math.max(...monthlyOptimized, ...monthlyStandard);
                const maxFormatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(maxMonthly);

                // Scale markers
                const scale25 = maxMonthly * 0.25;
                const scale50 = maxMonthly * 0.50;
                const scale75 = maxMonthly * 0.75;

                let chartHTML = '<div class="relative">';

                // Grid lines with labels
                chartHTML += '<div class="absolute inset-0 flex flex-col justify-between pointer-events-none" style="height: 160px;">';
                chartHTML += `<div class="border-b border-white/5 flex items-center"><span class="text-[7px] text-white/30 -ml-1">${maxFormatted}€</span></div>`;
                chartHTML += '<div class="border-b border-white/5"></div>';
                chartHTML += '<div class="border-b border-white/5"></div>';
                chartHTML += '<div class="border-b border-white/5"></div>';
                chartHTML += '</div>';

                chartHTML += '<div class="flex items-end justify-between gap-1 relative" style="height: 160px;">';

                for (let i = 0; i < 12; i++) {
                    const stdH = maxMonthly > 0 ? (monthlyStandard[i] / maxMonthly) * 100 : 0;
                    const optH = maxMonthly > 0 ? (monthlyOptimized[i] / maxMonthly) * 100 : 0;
                    const stdVal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(monthlyStandard[i]);
                    const optVal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(monthlyOptimized[i]);

                    chartHTML += `
                        <div class="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                            <div class="flex gap-[2px] items-end w-full justify-center relative" style="height: calc(100% - 18px);">
                                <!-- Sans Kazas bar -->
                                <div class="w-[38%] bg-white/15 hover:bg-white/25 rounded-t-sm transition-all duration-300 relative cursor-pointer group/bar1" style="height: ${stdH}%;">
                                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar1:opacity-100 transition-opacity bg-black/80 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                                        ${stdVal}€
                                    </div>
                                </div>
                                <!-- Avec Kazas bar -->
                                <div class="w-[38%] bg-gold hover:bg-gold/80 rounded-t-sm shadow-[0_0_6px_rgba(212,175,55,0.3)] transition-all duration-300 relative cursor-pointer group/bar2" style="height: ${optH}%;">
                                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar2:opacity-100 transition-opacity bg-gold/90 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                                        ${optVal}€
                                    </div>
                                </div>
                            </div>
                            <span class="text-[8px] text-white/40 font-mono leading-none transition-colors">${monthLabels[i]}</span>
                        </div>`;
                }
                chartHTML += '</div>';

                // Legend
                chartHTML += `
                    <div class="flex justify-center gap-4 mt-2">
                        <div class="flex items-center gap-1.5">
                            <div class="w-2.5 h-2.5 bg-white/15 rounded-sm"></div>
                            <span class="text-[9px] text-white/40">Sans Kazas</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <div class="w-2.5 h-2.5 bg-gold rounded-sm"></div>
                            <span class="text-[9px] text-gold/60">Avec Kazas</span>
                        </div>
                    </div>`;

                chartContainer.innerHTML = chartHTML;
            }
        }

        // Event Listeners
        simRooms.addEventListener('input', updateSimulator);
        simCapacity.addEventListener('input', updateSimulator);
        simEquipment.addEventListener('input', updateSimulator);
        if (simPool) simPool.addEventListener('change', updateSimulator);
        if (simView) simView.addEventListener('change', updateSimulator);
        if (simMultiSite) simMultiSite.addEventListener('change', updateSimulator);
        if (simOptimizedListing) simOptimizedListing.addEventListener('change', updateSimulator);

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
}

// Execute Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
