// ════════════════════════════════════════════
// SIMULATOR ENGINE (adapted from simulator.js)
// ════════════════════════════════════════════
const CAPS = {
    ADR_floor: 90, ADR_cap: 1200,
    OCC_floor: 0.15, OCC_cap: 0.92,
    ADR_pct_min: -25, ADR_pct_max: 60,
    OCC_pct_min: -30, OCC_pct_max: 35
};
const ZONE = {
    Sud_Caraibes:   { adr: 260, occ: 0.55 },
    Sud_Atlantique: { adr: 230, occ: 0.50 },
    Nord_Caraibes:  { adr: 210, occ: 0.48 },
    Nord_Atlantique:{ adr: 190, occ: 0.45 }
};
const ALPHA = 1.25, BETA = 1.35;
const H_OV   = { none:{a:0,o:0}, partial:{a:6,o:2}, dominant:{a:14,o:4} };
const H_BOOL = {
    beach_walkable:{a:10,o:5}, private_pool:{a:10,o:4},
    hot_tub_jacuzzi:{a:18,o:2}, ac_all_bedrooms:{a:7,o:7}
};
const BED_U={a:6,o:2}, BATH_U={a:4,o:1}, REF_BED=3, REF_BATH=2;
const CW = {
    wifi_quality:{ poor:{a:-3,o:-6},ok:{a:0,o:0},good:{a:1,o:3},excellent:{a:2,o:6} },
    pro_photos:{ f:{a:0,o:0},t:{a:3,o:8} },
    amenities_fully_tagged:{ f:{a:0,o:0},t:{a:0,o:4} },
    review_score_band:{ lt_4_6:{a:-3,o:-8},'4_6_to_4_79':{a:2,o:4},gte_4_8:{a:4,o:8} },
    dynamic_pricing_enabled:{ f:{a:0,o:0},t:{a:4,o:2} },
    min_nights_band:{ '1_2':{a:0,o:3},'3_4':{a:1,o:1},gte_5:{a:2,o:-4} },
    multi_platform_distribution:{ f:{a:0,o:0},t:{a:1,o:6} }
};
const P_WITHOUT = { pro_photos:false,amenities_fully_tagged:false,dynamic_pricing_enabled:false,multi_platform_distribution:false,wifi_quality:'good',min_nights_band:'3_4',review_score_band:'4_6_to_4_79' };
const P_WITH    = { pro_photos:true,amenities_fully_tagged:true,dynamic_pricing_enabled:true,multi_platform_distribution:true,wifi_quality:'excellent',min_nights_band:'1_2',review_score_band:'gte_4_8' };
const S_ADR     = [1.40,1.50,1.30,1.20,0.70,0.65,1.10,1.15,0.95,0.75,0.85,1.45];
const S_OCC_STD = [1.10,1.15,1.05,1.00,0.75,0.70,1.00,1.05,0.85,0.70,0.80,1.20];
const S_OCC_OPT = [1.15,1.20,1.12,1.08,0.85,0.80,1.10,1.15,0.95,0.85,0.90,1.25];
const DAYS      = [31,28,31,30,31,30,31,31,30,31,30,31];

function evalCL(key, val) {
    const w = CW[key]; if(!w) return {a:0,o:0};
    if(typeof val==='boolean') return val?(w.t||{a:0,o:0}):(w.f||{a:0,o:0});
    return w[val]||{a:0,o:0};
}
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

function compute(inp) {
    const base = ZONE[inp.zone]||ZONE.Sud_Caraibes;
    let hA=0,hO=0;
    const ov=H_OV[inp.ocean_view]||{a:0,o:0}; hA+=ov.a; hO+=ov.o;
    for(const[k,w]of Object.entries(H_BOOL)){ if(inp[k]){hA+=w.a;hO+=w.o;} }
    hA+=(inp.bedrooms-REF_BED)*BED_U.a; hO+=(inp.bedrooms-REF_BED)*BED_U.o;
    hA+=(inp.bathrooms-REF_BATH)*BATH_U.a; hO+=(inp.bathrooms-REF_BATH)*BATH_U.o;
    const cWithout={...P_WITHOUT};
    ['wifi_quality','pro_photos','review_score_band','min_nights_band','multi_platform_distribution'].forEach(k=>{if(inp[k]!==undefined)cWithout[k]=inp[k];});
    let cA_w=0,cO_w=0;
    for(const[k,v]of Object.entries(cWithout)){const r=evalCL(k,v);cA_w+=r.a;cO_w+=r.o;}
    let cA_opt=0,cO_opt=0;
    for(const[k,v]of Object.entries(P_WITH)){const r=evalCL(k,v);cA_opt+=r.a;cO_opt+=r.o;}
    const adrPctW=clamp(hA+cA_w,CAPS.ADR_pct_min,CAPS.ADR_pct_max);
    const occPctW=clamp(hO+cO_w,CAPS.OCC_pct_min,CAPS.OCC_pct_max);
    const adrW=clamp(base.adr*(1+adrPctW/100),CAPS.ADR_floor,CAPS.ADR_cap);
    const occW=clamp(base.occ*(1+occPctW/100),CAPS.OCC_floor,CAPS.OCC_cap);
    const adrHead=Math.max(0,((CAPS.ADR_cap-adrW)/adrW)*100);
    const occHead=Math.max(0,((CAPS.OCC_cap-occW)/occW)*100);
    const adrBoost=Math.min(cA_opt*ALPHA,adrHead);
    const occBoost=Math.min(cO_opt*BETA,occHead);
    const adrPctWith=Math.max(CAPS.ADR_pct_min,hA+adrBoost);
    const occPctWith=Math.max(CAPS.OCC_pct_min,hO+occBoost);
    const adrWith=clamp(base.adr*(1+adrPctWith/100),CAPS.ADR_floor,CAPS.ADR_cap);
    const occWith=clamp(base.occ*(1+occPctWith/100),CAPS.OCC_floor,CAPS.OCC_cap);
    let rStd=0,rOpt=0;
    for(let i=0;i<12;i++){
        rStd+=Math.round(adrW*S_ADR[i]*DAYS[i]*occW*S_OCC_STD[i]);
        rOpt+=Math.round(adrWith*S_ADR[i]*DAYS[i]*occWith*S_OCC_OPT[i]);
    }
    return { rStd, rOpt, adrW, occW, adrWith, occWith };
}

const fmt = new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});

function buildInsight(inp) {
    if(!inp.private_pool&&!inp.hot_tub_jacuzzi) return "L'ajout d'une piscine privée peut augmenter vos revenus de 15-25%. L'audit détaille le ROI pour votre bien.";
    if(!inp.pro_photos) return "Des photos professionnelles améliorent le taux de conversion de 8-15% selon nos données marché.";
    if(inp.ocean_view==='none'&&inp.zone==='Sud_Caraibes') return "Dans le Sud Caraïbes, les biens sans vue mer compensent par des équipements différenciants. L'audit identifie lesquels.";
    if(inp.zone.startsWith('Nord')) return "Le Nord de la Martinique est moins saturé — fort potentiel pour qui sait valoriser sa singularité.";
    if(inp.bedrooms>=5) return "Les grands biens (5+ chambres) sont rares et très demandés pour fêtes et séminaires. Votre pricing doit le refléter.";
    return "Votre bien présente des leviers d'optimisation non exploités. L'audit identifie les 5 actions prioritaires.";
}

// ════════════════════════════════════════════
// FORM STATE
// ════════════════════════════════════════════
const state = {
    step: 0, // 0-3 = form steps, 4 = results
    data: {
        zone: 'Sud_Caraibes',
        ocean_view: 'none',
        beach_walkable: false,
        bedrooms: 3,
        bathrooms: 2,
        private_pool: false,
        hot_tub_jacuzzi: false,
        ac_all_bedrooms: false,
        review_score_band: '4_6_to_4_79',
        pro_photos: false,
        multi_platform_distribution: false,
        min_nights_band: '1_2',
    }
};

const STEPS = [
    { id: 'localisation', label: 'Localisation' },
    { id: 'bien',         label: 'Votre bien' },
    { id: 'situation',    label: 'Situation actuelle' },
    { id: 'contact',      label: 'Vos coordonnées' },
];

// ════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════
export function initAuditForm() {
    const root = document.getElementById('audit-form-root');
    if (!root) return;
    render();

    function render() {
        if (state.step < 4) renderStep();
        else renderResults();
    }

    function renderStep() {
        const total = STEPS.length;
        const s = state.step;

        root.innerHTML = `
            <!-- Progress -->
            <div class="mb-8">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Étape ${s+1} / ${total}</span>
                    <span class="text-xs font-medium text-gray-400">${STEPS[s].label}</span>
                </div>
                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-gold rounded-full transition-all duration-500" style="width:${((s+1)/total)*100}%"></div>
                </div>
            </div>

            <!-- Step title -->
            <h1 class="text-3xl font-bold text-primary mb-2">${stepTitle(s)}</h1>
            <p class="text-gray-500 text-sm mb-8 leading-relaxed">${stepSubtitle(s)}</p>

            <!-- Step fields -->
            <div id="step-fields" class="space-y-6 mb-10">
                ${stepFields(s)}
            </div>

            <!-- Navigation -->
            <div class="flex gap-3">
                ${s > 0 ? `<button id="btn-back" class="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:border-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2">
                    <span class="material-icons-round text-sm">arrow_back</span> Retour
                </button>` : ''}
                ${s < 3 ? `<button id="btn-next" class="flex-1 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-lg">
                    Continuer <span class="material-icons-round text-sm">arrow_forward</span>
                </button>` : `<button id="btn-submit" class="flex-1 py-4 rounded-2xl bg-gold text-primary-dark font-bold hover:bg-[#c9a330] transition-all flex items-center justify-center gap-2 shadow-neon">
                    <span id="submit-label" class="flex items-center gap-2">Voir mon estimation <span class="material-icons-round text-sm">trending_up</span></span>
                    <span id="submit-spinner" class="hidden items-center gap-2"><svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg> Calcul en cours…</span>
                </button>`}
            </div>
            ${s === 2 ? `<button id="btn-skip" class="w-full mt-3 text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-2">Passer cette étape →</button>` : ''}
        `;

        bindStepEvents(s);
    }

    function renderResults() {
        const r = compute(state.data);
        const monthlyMin = Math.round((r.rStd / 12) / 100) * 100;
        const monthlyMax = Math.round((r.rOpt / 12) / 100) * 100;
        const insight = buildInsight(state.data);

        root.innerHTML = `
            <!-- Header -->
            <div class="mb-8">
                <div class="h-1.5 bg-gold rounded-full mb-6"></div>
                <h1 class="text-3xl font-bold text-primary mb-2">Votre estimation</h1>
                <p class="text-gray-500 text-sm">Basé sur les données du marché martiniquais.</p>
            </div>

            <!-- FREE: Range -->
            <div class="bg-primary text-white rounded-3xl p-6 mb-4 text-center shadow-xl">
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-3">Potentiel mensuel estimé</p>
                <div class="flex items-baseline justify-center gap-3 mb-1">
                    <span class="text-4xl font-bold">${fmt.format(monthlyMin)}</span>
                    <span class="text-white/40 text-2xl">–</span>
                    <span class="text-4xl font-bold text-gold">${fmt.format(monthlyMax)}</span>
                </div>
                <p class="text-white/50 text-xs uppercase tracking-wider">revenus bruts mensuels</p>
            </div>

            <!-- FREE: Insight -->
            <div class="flex gap-3 bg-gold/5 border border-gold/20 rounded-2xl p-4 items-start mb-4">
                <span class="material-icons-round text-gold text-base shrink-0 mt-0.5">lightbulb</span>
                <p class="text-gray-700 text-sm leading-relaxed">${insight}</p>
            </div>

            <!-- LOCKED: Paywall -->
            <div class="relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                <!-- Blurred preview -->
                <div class="blur-md pointer-events-none select-none opacity-40 p-5 space-y-3 bg-white">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <p class="text-[9px] text-gray-400 mb-1 uppercase">Prix / Nuit</p>
                            <p class="text-xl font-bold text-gold">340 €</p>
                        </div>
                        <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <p class="text-[9px] text-gray-400 mb-1 uppercase">Taux occup.</p>
                            <p class="text-xl font-bold text-primary">78%</p>
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-2xl p-3 border border-gray-100 h-20 flex items-end gap-1 pb-2">
                        <div class="flex-1 bg-gold/40 rounded-t" style="height:55%"></div>
                        <div class="flex-1 bg-gold/40 rounded-t" style="height:80%"></div>
                        <div class="flex-1 bg-gold/40 rounded-t" style="height:95%"></div>
                        <div class="flex-1 bg-gold/40 rounded-t" style="height:78%"></div>
                        <div class="flex-1 bg-gray-300 rounded-t" style="height:40%"></div>
                        <div class="flex-1 bg-gray-300 rounded-t" style="height:35%"></div>
                        <div class="flex-1 bg-gold/40 rounded-t" style="height:65%"></div>
                        <div class="flex-1 bg-gold/40 rounded-t" style="height:72%"></div>
                        <div class="flex-1 bg-gray-300 rounded-t" style="height:50%"></div>
                        <div class="flex-1 bg-gray-300 rounded-t" style="height:45%"></div>
                        <div class="flex-1 bg-gray-300 rounded-t" style="height:55%"></div>
                        <div class="flex-1 bg-gold/40 rounded-t" style="height:88%"></div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                            <span class="text-xs text-gray-500">Benchmark concurrents</span>
                            <span class="text-xs font-bold text-gray-800">15 biens analysés</span>
                        </div>
                        <div class="flex justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                            <span class="text-xs text-gray-500">Plan d'action</span>
                            <span class="text-xs font-bold text-gray-800">30 / 60 / 90 jours</span>
                        </div>
                    </div>
                </div>
                <!-- Overlay -->
                <div class="absolute inset-0 flex flex-col items-center justify-center p-6 rounded-3xl"
                     style="background:linear-gradient(to bottom,rgba(253,252,248,0.1) 0%,rgba(253,252,248,0.98) 25%)">
                    <div class="w-11 h-11 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center mb-3">
                        <span class="material-icons-round text-primary">lock</span>
                    </div>
                    <h4 class="text-primary font-bold text-lg text-center mb-1">Rapport complet</h4>
                    <p class="text-gray-500 text-sm text-center mb-4 max-w-xs">Benchmark · Plan 90 jours · Prix optimal · Diagnostic annonce · Appel 30 min</p>
                    <ul class="space-y-1.5 mb-5 self-stretch max-w-xs mx-auto">
                        <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Revenus mois par mois sur 12 mois</li>
                        <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Benchmark 15 concurrents directs</li>
                        <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Diagnostic annonce (20 points)</li>
                        <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Plan d'action 30/60/90 jours chiffré</li>
                        <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Appel 30 min avec Cyril</li>
                    </ul>
                    <button id="unlock-audit-btn"
                        class="squishy-btn w-full max-w-xs bg-gold text-primary-dark font-bold py-4 flex items-center justify-center gap-2">
                        Débloquer mon Audit — 79€
                        <span class="material-icons-round text-sm">arrow_forward</span>
                    </button>
                    <p class="text-gray-400 text-xs mt-2 text-center">Cyril vous contacte sous 48h</p>
                </div>
            </div>

            <!-- Restart -->
            <button id="btn-restart" class="w-full mt-4 text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-2">
                ← Recommencer avec un autre bien
            </button>
        `;

        // Store for paywall
        window._kazasSimData = {
            zone: state.data.zone, bedrooms: state.data.bedrooms, bathrooms: state.data.bathrooms,
            private_pool: state.data.private_pool, ocean_view: state.data.ocean_view,
            monthly_min: monthlyMin, monthly_max: monthlyMax,
            annual_std: r.rStd, annual_opt: r.rOpt,
        };

        document.getElementById('btn-restart')?.addEventListener('click', () => {
            state.step = 0;
            render();
        });

        // Re-init paywall since DOM changed
        initUnlockBtn();
    }

    function stepTitle(s) {
        return ['Où se situe votre bien ?', 'Parlez-nous de votre villa', 'Votre situation actuelle', 'Vos coordonnées'][s];
    }
    function stepSubtitle(s) {
        return [
            'Ces informations nous permettent de calibrer l\'estimation sur les données réelles du marché martiniquais.',
            'Plus votre bien est détaillé, plus l\'estimation sera précise.',
            'Ces paramètres affinent l\'analyse. Vous pouvez passer cette étape si vous débutez.',
            'Cyril vous enverra votre estimation complète sous 48h.'
        ][s];
    }

    function stepFields(s) {
        const d = state.data;
        if (s === 0) return `
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Zone géographique</label>
                <div class="grid grid-cols-2 gap-2" data-seg="zone">
                    ${['Sud_Caraibes','Sud_Atlantique','Nord_Caraibes','Nord_Atlantique'].map(v =>
                        `<button data-value="${v}" class="seg-btn py-3 px-3 rounded-2xl border text-sm font-medium transition-all ${d.zone===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${zoneLabel(v)}</button>`
                    ).join('')}
                </div>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Vue mer</label>
                <div class="grid grid-cols-3 gap-2" data-seg="ocean_view">
                    ${[['none','Aucune'],['partial','Partielle'],['dominant','Dominante']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-3 rounded-2xl border text-sm font-medium transition-all ${d.ocean_view===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
            </div>
            <label class="flex items-center justify-between cursor-pointer">
                <div>
                    <span class="text-sm font-bold text-gray-700">Plage accessible à pied</span>
                    <p class="text-xs text-gray-400 mt-0.5">Moins de 10 minutes à pied</p>
                </div>
                ${toggleHTML('beach_walkable', d.beach_walkable)}
            </label>
        `;
        if (s === 1) return `
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-4">Nombre de chambres</label>
                <div class="flex items-center justify-between bg-gray-50 rounded-2xl border border-gray-200 p-4">
                    <button data-stepper="bedrooms" data-dir="-1" class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-all text-xl font-light">−</button>
                    <span class="text-3xl font-bold text-primary" id="bedrooms-display">${d.bedrooms}</span>
                    <button data-stepper="bedrooms" data-dir="1" class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-all text-xl font-light">+</button>
                </div>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-4">Salles de bain</label>
                <div class="flex items-center justify-between bg-gray-50 rounded-2xl border border-gray-200 p-4">
                    <button data-stepper="bathrooms" data-dir="-1" class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-all text-xl font-light">−</button>
                    <span class="text-3xl font-bold text-primary" id="bathrooms-display">${d.bathrooms}</span>
                    <button data-stepper="bathrooms" data-dir="1" class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-all text-xl font-light">+</button>
                </div>
            </div>
            <div class="space-y-4">
                ${toggleRow('private_pool', 'Piscine privée', 'Piscine à usage exclusif', d.private_pool)}
                ${toggleRow('hot_tub_jacuzzi', 'Jacuzzi / Bain à remous', '', d.hot_tub_jacuzzi)}
                ${toggleRow('ac_all_bedrooms', 'Climatisation dans toutes les chambres', '', d.ac_all_bedrooms)}
            </div>
        `;
        if (s === 2) return `
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Note moyenne actuelle</label>
                <div class="grid grid-cols-3 gap-2" data-seg="review_score_band">
                    ${[['lt_4_6','< 4.6'],['4_6_to_4_79','4.6 – 4.8'],['gte_4_8','≥ 4.8']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-3 rounded-2xl border text-sm font-medium transition-all ${d.review_score_band===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
                <p class="text-xs text-gray-400 mt-2">Pas encore de note ? Choisissez "< 4.6".</p>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Durée minimale de séjour</label>
                <div class="grid grid-cols-3 gap-2" data-seg="min_nights_band">
                    ${[['1_2','1 – 2 nuits'],['3_4','3 – 4 nuits'],['gte_5','5 nuits+']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-2.5 rounded-2xl border text-xs font-medium transition-all ${d.min_nights_band===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
            </div>
            <div class="space-y-4">
                ${toggleRow('pro_photos', 'Photos professionnelles', 'Prises par un photographe', d.pro_photos)}
                ${toggleRow('multi_platform_distribution', 'Diffusion multi-plateformes', 'Airbnb + Booking + autres', d.multi_platform_distribution)}
            </div>
        `;
        if (s === 3) return `
            <div class="grid grid-cols-1 gap-4">
                <div>
                    <label class="text-xs uppercase tracking-widest font-bold text-gray-400 ml-1 mb-2 block">Prénom &amp; Nom *</label>
                    <input id="contact-name" type="text" required placeholder="Jean Dupont" value="${window._auditContact?.name||''}"
                        class="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-0 text-primary placeholder-gray-300 transition-all text-sm shadow-sm" />
                </div>
                <div>
                    <label class="text-xs uppercase tracking-widest font-bold text-gray-400 ml-1 mb-2 block">Email *</label>
                    <input id="contact-email" type="email" required placeholder="jean@mail.com" value="${window._auditContact?.email||''}"
                        class="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-0 text-primary placeholder-gray-300 transition-all text-sm shadow-sm" />
                </div>
                <div>
                    <label class="text-xs uppercase tracking-widest font-bold text-gray-400 ml-1 mb-2 block">Téléphone *</label>
                    <input id="contact-phone" type="tel" required placeholder="+33 6 00 00 00 00" value="${window._auditContact?.phone||''}"
                        class="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-0 text-primary placeholder-gray-300 transition-all text-sm shadow-sm" />
                </div>
                <div>
                    <label class="text-xs uppercase tracking-widest font-bold text-gray-400 ml-1 mb-2 block">URL Airbnb <span class="font-normal normal-case">(optionnel)</span></label>
                    <input id="contact-url" type="url" placeholder="https://airbnb.com/rooms/..." value="${window._auditContact?.url||''}"
                        class="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-0 text-primary placeholder-gray-300 transition-all text-sm shadow-sm" />
                </div>
            </div>
            <p class="text-xs text-gray-400 -mt-2">Vos informations sont confidentielles et ne seront jamais partagées.</p>
        `;
        return '';
    }

    function zoneLabel(v) {
        return {Sud_Caraibes:'Sud Caraïbes',Sud_Atlantique:'Sud Atlantique',Nord_Caraibes:'Nord Caraïbes',Nord_Atlantique:'Nord Atlantique'}[v]||v;
    }

    function toggleHTML(key, checked) {
        return `<div class="relative" data-toggle="${key}">
            <div class="w-12 h-6 ${checked?'bg-primary':'bg-gray-200'} rounded-full cursor-pointer transition-all duration-300 toggle-track"></div>
            <div class="absolute top-1 ${checked?'left-7':'left-1'} w-4 h-4 bg-white rounded-full shadow transition-all duration-300 toggle-thumb"></div>
        </div>`;
    }

    function toggleRow(key, label, sub, checked) {
        return `<label class="flex items-center justify-between cursor-pointer bg-gray-50 rounded-2xl border border-gray-200 p-4 hover:border-gray-300 transition-all">
            <div>
                <span class="text-sm font-bold text-gray-700">${label}</span>
                ${sub ? `<p class="text-xs text-gray-400 mt-0.5">${sub}</p>` : ''}
            </div>
            ${toggleHTML(key, checked)}
        </label>`;
    }

    function bindStepEvents(s) {
        // Segmented buttons
        root.querySelectorAll('[data-seg]').forEach(group => {
            const key = group.dataset.seg;
            group.querySelectorAll('.seg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    state.data[key] = btn.dataset.value;
                    group.querySelectorAll('.seg-btn').forEach(b => {
                        b.className = b.className
                            .replace('bg-primary text-white border-primary shadow-sm', 'border-gray-200 text-gray-600 hover:border-gray-400')
                    });
                    btn.className = btn.className
                        .replace('border-gray-200 text-gray-600 hover:border-gray-400', 'bg-primary text-white border-primary shadow-sm')
                });
            });
        });

        // Toggles
        root.querySelectorAll('[data-toggle]').forEach(el => {
            el.addEventListener('click', () => {
                const key = el.dataset.toggle;
                state.data[key] = !state.data[key];
                const track = el.querySelector('.toggle-track');
                const thumb = el.querySelector('.toggle-thumb');
                if (state.data[key]) {
                    track.classList.replace('bg-gray-200','bg-primary');
                    thumb.classList.replace('left-1','left-7');
                } else {
                    track.classList.replace('bg-primary','bg-gray-200');
                    thumb.classList.replace('left-7','left-1');
                }
            });
        });

        // Steppers
        root.querySelectorAll('[data-stepper]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.stepper;
                const dir = parseInt(btn.dataset.dir);
                state.data[key] = Math.max(1, Math.min(10, state.data[key] + dir));
                const display = document.getElementById(`${key}-display`);
                if (display) display.textContent = state.data[key];
            });
        });

        // Next
        document.getElementById('btn-next')?.addEventListener('click', () => {
            state.step++;
            render();
            scrollToTop();
        });

        // Back
        document.getElementById('btn-back')?.addEventListener('click', () => {
            state.step--;
            render();
            scrollToTop();
        });

        // Skip (step 2 / situation actuelle)
        document.getElementById('btn-skip')?.addEventListener('click', () => {
            state.step++;
            render();
            scrollToTop();
        });

        // Submit (step 3 / contact)
        document.getElementById('btn-submit')?.addEventListener('click', async () => {
            const name  = document.getElementById('contact-name')?.value?.trim();
            const email = document.getElementById('contact-email')?.value?.trim();
            const phone = document.getElementById('contact-phone')?.value?.trim();
            const url   = document.getElementById('contact-url')?.value?.trim() || '';

            if (!name || !email || !phone) {
                // Simple validation shake — just alert for now
                alert('Veuillez remplir votre nom, email et téléphone.');
                return;
            }

            // Save contact for paywall modal pre-fill
            window._auditContact = { name, email, phone, url };

            // Show spinner
            const label   = document.getElementById('submit-label');
            const spinner = document.getElementById('submit-spinner');
            const btn     = document.getElementById('btn-submit');
            if (btn) btn.disabled = true;
            label?.classList.add('hidden');
            spinner?.classList.remove('hidden');
            spinner?.classList.add('flex');

            // Pre-fill paywall modal fields
            const pName  = document.getElementById('audit-name');
            const pEmail = document.getElementById('audit-email');
            const pPhone = document.getElementById('audit-phone');
            const pUrl   = document.getElementById('audit-url');
            if (pName)  pName.value  = name;
            if (pEmail) pEmail.value = email;
            if (pPhone) pPhone.value = phone;
            if (pUrl)   pUrl.value   = url;

            // Send notification email to Cyril (non-blocking)
            const simResult = compute(state.data);
            const monthlyMin = Math.round((simResult.rStd / 12) / 100) * 100;
            const monthlyMax = Math.round((simResult.rOpt / 12) / 100) * 100;
            const simPayload = {
                zone: state.data.zone, bedrooms: state.data.bedrooms,
                bathrooms: state.data.bathrooms, private_pool: state.data.private_pool,
                ocean_view: state.data.ocean_view,
                monthly_min: monthlyMin, monthly_max: monthlyMax,
                annual_std: simResult.rStd, annual_opt: simResult.rOpt,
            };
            window._kazasSimData = simPayload;

            fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_name: name, from_email: email, phone,
                    airbnb_url: url, sim_data: JSON.stringify(simPayload)
                })
            }).catch(err => console.warn('[Kazas] audit notify failed:', err));

            // Go to results (don't block on API response)
            setTimeout(() => {
                state.step = 4;
                render();
                scrollToTop();
            }, 600);
        });
    }

    function initUnlockBtn() {
        // The paywall module handles #unlock-audit-btn, but since DOM is re-rendered,
        // we need to wire it up again
        document.querySelectorAll('#unlock-audit-btn, #unlock-audit-btn-2').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = document.getElementById('paywall-modal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                    document.body.style.overflow = 'hidden';
                }
            });
        });
    }

    function scrollToTop() {
        const formPanel = document.getElementById('form-panel');
        if (formPanel) formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
