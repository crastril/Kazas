/**
 * Simulator Component Logic
 * calculate revenue estimates based on inputs.
 */
export function initSimulator() {
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

    // Detail Elements
    const simPriceStandard = document.getElementById('sim-price-standard');
    const simOccupancyStandard = document.getElementById('sim-occupancy-standard');
    const simPriceKazas = document.getElementById('sim-price-kazas');
    const simOccupancyKazas = document.getElementById('sim-occupancy-kazas');
    const simImpactsList = document.getElementById('sim-impacts-list');

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
            const hasPool = simPool ? simPool.checked : false;
            const hasView = simView ? simView.checked : false;
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

            // Base Price Formula
            let basePrice = (rooms * 40) + (capacity * 8);

            // 1. Standard (Sans Kazas) Calculation
            const equipmentPriceMultipliers = { 1: 1, 2: 1.10, 3: 1.20 };
            let standardPrice = basePrice * equipmentPriceMultipliers[equipment];

            let standardOccupancy = 0.30;
            if (equipment === 2) standardOccupancy += 0.02;
            if (equipment === 3) standardOccupancy += 0.04;
            standardOccupancy = Math.min(standardOccupancy, 0.40);

            // 2. Optimized (Avec Kazas)
            let optimizedPrice = standardPrice;
            let impacts = [];
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
            if (hasMultiSite) occBoosts.push({ label: "Multi-sites", rawBoost: 0.08, detail: "" });

            // Annonce Optimisée
            if (hasOptimizedListing) occBoosts.push({ label: "Annonce Opti.", rawBoost: 0.05, detail: "" });

            // Decoration
            if (hasDecoration) {
                const priceBoost = optimizedPrice * 0.10;
                optimizedPrice += priceBoost;
                occBoosts.push({ label: "Déco Pro", rawBoost: 0.04, detail: "+10% Prix" });
            }

            // Photos Pro
            if (hasPhotos) occBoosts.push({ label: "Photos Pro", rawBoost: 0.15, detail: "" });

            // --- Proportional Redistribution ---
            const MAX_OCCUPANCY = 0.85; // Fixed Cap
            const headroom = MAX_OCCUPANCY - standardOccupancy;
            const totalRawBoost = occBoosts.reduce((sum, b) => sum + b.rawBoost, 0);
            const scaleFactor = totalRawBoost > headroom ? headroom / totalRawBoost : 1;

            let optimizedOccupancy = standardOccupancy;
            occBoosts.forEach(boost => {
                const actualBoost = boost.rawBoost * scaleFactor;
                optimizedOccupancy += actualBoost;
                const actualPct = Math.round(actualBoost * 100);

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

            // Yield Management
            optimizedPrice *= 1.03;

            optimizedOccupancy = Math.min(optimizedOccupancy, MAX_OCCUPANCY);

            // 3. Seasonality & Monthly Revenue
            const seasonCoeffs = [1.4, 1.5, 1.3, 1.2, 0.7, 0.65, 1.1, 1.15, 0.95, 0.75, 0.85, 1.45];
            const standardOccCoeffs = [1.1, 1.15, 1.05, 1.0, 0.75, 0.70, 1.0, 1.05, 0.85, 0.70, 0.80, 1.2];
            const kazasOccCoeffs = [1.15, 1.2, 1.12, 1.08, 0.85, 0.80, 1.1, 1.15, 0.95, 0.85, 0.90, 1.25];

            const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            const monthlyStandard = [];
            const monthlyOptimized = [];
            let standardRevenue = 0;
            let optimizedRevenue = 0;

            for (let i = 0; i < 12; i++) {
                const priceCoeff = seasonCoeffs[i];
                const days = daysPerMonth[i];
                const stdMonthly = Math.round(standardPrice * priceCoeff * days * standardOccupancy * standardOccCoeffs[i]);
                const optMonthly = Math.round(optimizedPrice * priceCoeff * days * optimizedOccupancy * kazasOccCoeffs[i]);

                monthlyStandard.push(stdMonthly);
                monthlyOptimized.push(optMonthly);
                standardRevenue += stdMonthly;
                optimizedRevenue += optMonthly;
            }

            // --- Display ---
            const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
            simRevenueDisplay.textContent = fmt.format(optimizedRevenue);
            simMarketDisplay.textContent = fmt.format(standardRevenue);

            if (simPriceStandard) simPriceStandard.textContent = fmt.format(standardPrice);
            if (simOccupancyStandard) simOccupancyStandard.textContent = `${Math.round(standardOccupancy * 100)}%`;

            if (simPriceKazas) simPriceKazas.textContent = fmt.format(optimizedPrice);
            if (simOccupancyKazas) simOccupancyKazas.textContent = `${Math.round(optimizedOccupancy * 100)}%`;

            // Impacts List
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

            renderChart(monthlyStandard, monthlyOptimized);
        }

        // --- Monthly Bar Chart Logic (Internal Helper) ---
        function renderChart(monthlyStandard, monthlyOptimized) {
            const chartContainer = document.getElementById('sim-monthly-chart');
            if (!chartContainer) return;

            const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            const maxMonthly = Math.max(...monthlyOptimized, ...monthlyStandard);
            const maxFormatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(maxMonthly);

            let chartHTML = '<div class="relative">';

            // Grid lines
            chartHTML += '<div class="absolute inset-0 flex flex-col justify-between pointer-events-none" style="height: 160px;">';
            chartHTML += `<div class="border-b border-white/5 flex items-center"><span class="text-[7px] text-white/30 -ml-1">${maxFormatted}€</span></div>`;
            chartHTML += '<div class="border-b border-white/5"></div><div class="border-b border-white/5"></div><div class="border-b border-white/5"></div></div>';

            chartHTML += '<div class="flex items-end justify-between gap-1 relative" style="height: 160px;">';

            for (let i = 0; i < 12; i++) {
                const stdH = maxMonthly > 0 ? (monthlyStandard[i] / maxMonthly) * 100 : 0;
                const optH = maxMonthly > 0 ? (monthlyOptimized[i] / maxMonthly) * 100 : 0;
                const stdVal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(monthlyStandard[i]);
                const optVal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(monthlyOptimized[i]);

                chartHTML += `
                    <div class="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                        <div class="flex gap-[2px] items-end w-full justify-center relative" style="height: calc(100% - 18px);">
                            <!-- Sans Kazas -->
                            <div class="w-[38%] bg-white/15 hover:bg-white/25 rounded-t-sm transition-all duration-300 relative cursor-pointer group/bar1" style="height: ${stdH}%;">
                                <div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar1:opacity-100 transition-opacity bg-black/80 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">${stdVal}€</div>
                            </div>
                            <!-- Avec Kazas -->
                            <div class="w-[38%] bg-gold hover:bg-gold/80 rounded-t-sm shadow-[0_0_6px_rgba(212,175,55,0.3)] transition-all duration-300 relative cursor-pointer group/bar2" style="height: ${optH}%;">
                                <div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar2:opacity-100 transition-opacity bg-gold/90 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">${optVal}€</div>
                            </div>
                        </div>
                        <span class="text-[8px] text-white/40 font-mono leading-none transition-colors">${monthLabels[i]}</span>
                    </div>`;
            }
            chartHTML += '</div>';

            // Legend
            chartHTML += `
                <div class="flex justify-center gap-4 mt-2">
                    <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 bg-white/15 rounded-sm"></div><span class="text-[9px] text-white/40">Sans Kazas</span></div>
                    <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 bg-gold rounded-sm"></div><span class="text-[9px] text-gold/60">Avec Kazas</span></div>
                </div>`;

            chartContainer.innerHTML = chartHTML;
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
        const toggleDeco = (val) => {
            simDecorationInput.value = val;
            updateClasses(simDecorationYes, simDecorationNo, val === 'true');
            updateSimulator();
        };
        simDecorationYes.addEventListener('click', () => toggleDeco('true'));
        simDecorationNo.addEventListener('click', () => toggleDeco('false'));

        // Toggle Photos
        const togglePhotos = (val) => {
            simPhotosInput.value = val;
            updateClasses(simPhotosYes, simPhotosNo, val === 'true');
            updateSimulator();
        };
        simPhotosYes.addEventListener('click', () => togglePhotos('true'));
        simPhotosNo.addEventListener('click', () => togglePhotos('false'));

        function updateClasses(btnYes, btnNo, isYes) {
            if (isYes) {
                // Active Button (Yes)
                btnYes.classList.remove('bg-white/5', 'text-white/60', 'hover:bg-white/10');
                btnYes.classList.add('bg-gold', 'text-primary', 'font-bold', 'shadow-neon', 'hover:bg-gold/90');

                // Inactive Button (No)
                btnNo.classList.remove('bg-gold', 'text-primary', 'font-bold', 'shadow-neon', 'hover:bg-gold/90');
                btnNo.classList.add('bg-white/5', 'text-white/60', 'hover:bg-white/10');
            } else {
                // Active Button (No)
                btnNo.classList.remove('bg-white/5', 'text-white/60', 'hover:bg-white/10');
                btnNo.classList.add('bg-gold', 'text-primary', 'font-bold', 'shadow-neon', 'hover:bg-gold/90');

                // Inactive Button (Yes)
                btnYes.classList.remove('bg-gold', 'text-primary', 'font-bold', 'shadow-neon', 'hover:bg-gold/90');
                btnYes.classList.add('bg-white/5', 'text-white/60', 'hover:bg-white/10');
            }
        }

        // Initialize
        updateSimulator();
    }
}
