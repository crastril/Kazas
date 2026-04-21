// ════════════════════════════════════════════
// SIMULATOR ENGINE  (adapted from simulator.js)
// ════════════════════════════════════════════
const CAPS = {
    ADR_floor: 45, ADR_cap: 600,
    OCC_floor: 0.15, OCC_cap: 0.92,
    ADR_pct_min: -25, ADR_pct_max: 60,
    OCC_pct_min: -30, OCC_pct_max: 35
};
const ZONE = {
    Sud_Caraibes:   { adr: 130, occ: 0.55 },
    Sud_Atlantique: { adr: 115, occ: 0.50 },
    Nord_Caraibes:  { adr: 105, occ: 0.48 },
    Nord_Atlantique:{ adr:  95, occ: 0.45 }
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
    dynamic_pricing:{ f:{a:0,o:0},t:{a:4,o:2} },
    min_nights_band:{ '1_2':{a:0,o:3},'3_4':{a:1,o:1},gte_5:{a:2,o:-4} },
    multi_platform_distribution:{ f:{a:0,o:0},t:{a:1,o:6} }
};
const P_WITHOUT = {
    pro_photos:false, amenities_fully_tagged:false, dynamic_pricing:false,
    multi_platform_distribution:false, wifi_quality:'good',
    min_nights_band:'3_4', review_score_band:'4_6_to_4_79'
};
const P_WITH = {
    pro_photos:true, amenities_fully_tagged:true, dynamic_pricing:true,
    multi_platform_distribution:true, wifi_quality:'excellent',
    min_nights_band:'1_2', review_score_band:'gte_4_8'
};
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

// Adapt form data keys to compute() expectations
function toComputeInput(d) {
    return {
        ...d,
        wifi_quality: d.wifi_fiber ? 'excellent' : 'ok',
        dynamic_pricing: d.dynamic_pricing,
    };
}

function compute(inp) {
    const base = ZONE[inp.zone]||ZONE.Sud_Caraibes;
    let hA=0,hO=0;
    const ov=H_OV[inp.ocean_view]||{a:0,o:0}; hA+=ov.a; hO+=ov.o;
    for(const[k,w]of Object.entries(H_BOOL)){ if(inp[k]){hA+=w.a;hO+=w.o;} }
    hA+=(inp.bedrooms-REF_BED)*BED_U.a; hO+=(inp.bedrooms-REF_BED)*BED_U.o;
    hA+=(inp.bathrooms-REF_BATH)*BATH_U.a; hO+=(inp.bathrooms-REF_BATH)*BATH_U.o;
    const cWithout={...P_WITHOUT};
    ['wifi_quality','pro_photos','review_score_band','min_nights_band','multi_platform_distribution','dynamic_pricing']
        .forEach(k=>{if(inp[k]!==undefined)cWithout[k]=inp[k];});
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

// ════════════════════════════════════════════
// COMMUNES & ZONES
// ════════════════════════════════════════════
const COMMUNES = [
    // Zone A — Sud Caraïbes
    { label: 'Les Trois-Îlets',   zone: 'Sud_Caraibes',    cz: 'A' },
    { label: 'Sainte-Anne',       zone: 'Sud_Caraibes',    cz: 'A' },
    { label: 'Le Diamant',        zone: 'Sud_Caraibes',    cz: 'A' },
    { label: "Anses-d'Arlet",     zone: 'Sud_Caraibes',    cz: 'A' },
    // Zone B — Sud Atlantique
    { label: 'Sainte-Luce',       zone: 'Sud_Atlantique',  cz: 'B' },
    { label: 'Le Marin',          zone: 'Sud_Atlantique',  cz: 'B' },
    { label: 'Le François',       zone: 'Sud_Atlantique',  cz: 'B' },
    { label: 'La Trinité',        zone: 'Sud_Atlantique',  cz: 'B' },
    // Zone C — Nord Caraïbes
    { label: 'Schoelcher',        zone: 'Nord_Caraibes',   cz: 'C' },
    { label: 'Le Carbet',         zone: 'Nord_Caraibes',   cz: 'C' },
    { label: 'Saint-Pierre',      zone: 'Nord_Caraibes',   cz: 'C' },
    // Zone D — Autres communes
    { label: 'Fort-de-France',    zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Le Lamentin',       zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Ducos',             zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Le Robert',         zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Le Vauclin',        zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Rivière-Pilote',    zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Sainte-Marie',      zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Basse-Pointe',      zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Le Prêcheur',       zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Le Morne-Rouge',    zone: 'Nord_Atlantique', cz: 'D' },
    { label: 'Autre commune',     zone: 'Nord_Atlantique', cz: 'D' },
];

function communeInfo(label) {
    return COMMUNES.find(c => c.label === label) || COMMUNES[COMMUNES.length-1];
}

// ════════════════════════════════════════════
// SCORING — 6 catégories pondérées /100
// ════════════════════════════════════════════

// 1. Pricing & Revenue Management  → /25
function scorePricing(d) {
    let s = 0;
    if (d.dynamic_pricing)      s += 8;
    if (d.seasonal_pricing)     s += 5;
    if (d.event_pricing)        s += 4;
    if (d.long_stay_discounts)  s += 4;
    s += { '1_2': 4, '3_4': 3, 'gte_5': 1 }[d.min_nights_band] || 3;
    return Math.min(25, s);
}

// 2. Trust & Social Proof          → /20
function scoreTrust(d) {
    let s = 0;
    if (d.superhost) s += 8;
    s += { 'gte_4_8': 4, '4_6_to_4_79': 2, 'lt_4_6': 0 }[d.review_score_band] || 0;
    s += { 'gte_50': 4, '20_49': 3, '5_19': 2, 'lt_5': 0 }[d.nb_reviews_band] || 0;
    s += { 'fast': 4, 'normal': 2, 'slow': 0 }[d.response_rate] || 2;
    return Math.min(20, s);
}

// 3. Visuel & Annonce              → /20
function scoreVisuel(d) {
    let s = 0;
    if (d.pro_photos)       s += 7;
    s += { 'gte_25': 3, '20_24': 2, '10_19': 1, 'lt_10': 0 }[d.nb_photos_band] || 0;
    s += { 'pool_ext': 3, 'sea_view': 3, 'other': 1, 'interior': 0 }[d.cover_type] || 0;
    if (d.optimized_title)  s += 4;
    if (d.long_description) s += 3;
    return Math.min(20, s);
}

// 4. Équipements & Amenities       → /15
function scoreAmenities(d) {
    let s = 0;
    if (d.private_pool)       s += 5;
    if (d.ac_all_bedrooms)    s += 2;
    if (d.wifi_fiber)         s += 2;
    s += { 'dominant': 2, 'partial': 1, 'none': 0 }[d.ocean_view] || 0;
    if (d.beach_walkable)     s += 1;
    if (d.hot_tub_jacuzzi)    s += 1;
    if (d.home_office)        s += 1;
    if (d.parking)            s += 1;
    return Math.min(15, s);
}

// 5. Localisation & Caractéristiques → /12
function scoreLocalisation(d) {
    let s = 0;
    const info = communeInfo(d.commune);
    s += { 'A': 4, 'B': 3, 'C': 2, 'D': 1 }[info.cz] || 1;
    s += d.bedrooms >= 3 ? 3 : d.bedrooms >= 2 ? 2 : 1;
    s += d.bathrooms >= d.bedrooms ? 2 : 1;
    s += { 'dominant': 2, 'partial': 1, 'none': 0 }[d.ocean_view] || 0;
    if (d.beach_walkable) s += 1;
    // max = 4+3+2+2+1 = 12
    return Math.min(12, s);
}

// 6. Opérationnel & Expérience     → /8
function scoreOperationnel(d) {
    let s = 0;
    if (d.flexible_checkin)                                  s += 2;
    s += { 'flexible': 2, 'moderate': 1, 'strict': 0 }[d.cancellation_policy] || 1;
    if (d.multi_platform_distribution)                       s += 2;
    if (d.welcome_pack)                                      s += 1;
    if (d.min_nights_band === '1_2')                         s += 1;
    return Math.min(8, s);
}

function computeAuditScore(d) {
    const pricing      = scorePricing(d);
    const trust        = scoreTrust(d);
    const visuel       = scoreVisuel(d);
    const amenities    = scoreAmenities(d);
    const localisation = scoreLocalisation(d);
    const operationnel = scoreOperationnel(d);
    const score        = pricing + trust + visuel + amenities + localisation + operationnel;
    const MAXES = { pricing:25, trust:20, visuel:20, amenities:15, localisation:12, operationnel:8 };
    const optimised = Object.entries({ pricing, trust, visuel, amenities, localisation, operationnel })
        .filter(([k,v]) => v / MAXES[k] >= 0.75).length;
    return { axes:{ pricing, trust, visuel, amenities, localisation, operationnel }, score, optimised };
}

// ════════════════════════════════════════════
// PROJECTION MULTIPLICATIVE (formule algo doc)
// ════════════════════════════════════════════
const LEVER_IMPACTS = {
    dynamic_pricing:    { impact: 0.25, cond: d => !d.dynamic_pricing },
    seasonal_pricing:   { impact: 0.10, cond: d => !d.seasonal_pricing },
    event_pricing:      { impact: 0.05, cond: d => !d.event_pricing },
    long_stay_discounts:{ impact: 0.07, cond: d => !d.long_stay_discounts },
    min_nights:         { impact: 0.04, cond: d => d.min_nights_band === 'gte_5' },
    superhost:          { impact: 0.20, cond: d => !d.superhost },
    pro_photos:         { impact: 0.20, cond: d => !d.pro_photos },
    nb_photos:          { impact: 0.06, cond: d => d.nb_photos_band === 'lt_10' || d.nb_photos_band === '10_19' },
    cover_type:         { impact: 0.05, cond: d => d.cover_type === 'interior' || !d.cover_type },
    optimized_title:    { impact: 0.10, cond: d => !d.optimized_title },
    long_description:   { impact: 0.05, cond: d => !d.long_description },
    multi_platform:     { impact: 0.25, cond: d => !d.multi_platform_distribution },
    flexible_checkin:   { impact: 0.07, cond: d => !d.flexible_checkin },
    cancellation:       { impact: 0.12, cond: d => d.cancellation_policy === 'strict' },
    welcome_pack:       { impact: 0.03, cond: d => !d.welcome_pack },
};

function projectRevenue(d) {
    const ci = toComputeInput(d);
    const r  = compute(ci);
    const activeLevers = Object.values(LEVER_IMPACTS).filter(l => l.cond(d));
    const n = activeLevers.length;
    const factor = n >= 4 ? 0.5 : n >= 2 ? 0.7 : 1.0;
    const gainPct = 1 - activeLevers.reduce((acc, l) => acc * (1 - l.impact * factor), 1);
    const rOpt = Math.round(r.rStd * (1 + gainPct));
    return { ...r, rOpt, gainPct };
}

// Gain mensuel moyen si on active un levier
function quickGain(key, val, d) {
    const base = projectRevenue(d);
    const mod  = projectRevenue({...d, [key]: val});
    return Math.max(0, Math.round((mod.rOpt - base.rOpt) / 12 / 100) * 100);
}

// ─── Analyse zone ─────────────────────────────────────────────────────────────
function zoneAnalysis(zone) {
    return ({
        Sud_Caraibes:    { label:'Sud Caraïbes',    text:"La zone la plus prisée de Martinique — et la plus compétitive. Les biens bien présentés atteignent 70–85 % de taux d'occupation en haute saison. La différenciation par les équipements et la qualité des photos est décisive." },
        Sud_Atlantique:  { label:'Sud Atlantique',  text:"Zone en forte progression, appréciée pour ses paysages naturels et son authenticité. Moins saturée que le Caraïbes, elle offre un excellent rapport effort/rendement pour les propriétaires qui soignent leur annonce." },
        Nord_Caraibes:   { label:'Nord Caraïbes',   text:"Zone d'aventure et de découverte, moins concurrentielle. Fort potentiel pour les biens qui valorisent leur singularité — végétation dense, accès à la forêt, paysages sauvages. L'ADR y est plus bas mais la fidélisation client y est forte." },
        Nord_Atlantique: { label:'Nord Atlantique', text:"Zone au plus grand potentiel de développement en Martinique. Peu saturée, elle s'adresse à une clientèle en quête de tranquillité et de paysages préservés. La montée en gamme y est particulièrement rentable." },
    })[zone] || { label:'Martinique', text:'' };
}

// ════════════════════════════════════════════
// FORM STATE
// ════════════════════════════════════════════
const state = {
    step: 0, // 0-5 = form steps, 6 = results
    data: {
        // Step 0 — Localisation
        commune:      'Les Trois-Îlets',
        zone:         'Sud_Caraibes',   // derived from commune
        ocean_view:   'none',
        beach_walkable: false,
        // Step 1 — Votre bien
        bedrooms:     3,
        bathrooms:    2,
        private_pool: false,
        hot_tub_jacuzzi:   false,
        ac_all_bedrooms:   false,
        wifi_fiber:        false,
        home_office:       false,
        parking:           false,
        // Step 2 — Annonce & Photos
        pro_photos:        false,
        nb_photos_band:    '10_19',     // 'lt_10' | '10_19' | '20_24' | 'gte_25'
        cover_type:        'interior',  // 'pool_ext' | 'sea_view' | 'interior' | 'other'
        optimized_title:   false,
        long_description:  false,
        // Step 3 — Pricing & Distribution
        dynamic_pricing:   false,
        seasonal_pricing:  false,
        event_pricing:     false,
        long_stay_discounts: false,
        min_nights_band:   '1_2',
        multi_platform_distribution: false,
        // Step 4 — Performance & Ops
        review_score_band: '4_6_to_4_79',
        nb_reviews_band:   '5_19',      // 'lt_5' | '5_19' | '20_49' | 'gte_50'
        superhost:         false,
        response_rate:     'normal',    // 'fast' | 'normal' | 'slow'
        flexible_checkin:  false,
        cancellation_policy: 'moderate',
        welcome_pack:      false,
    }
};

const STEPS = [
    { id: 'localisation', label: 'Localisation' },
    { id: 'bien',         label: 'Votre bien' },
    { id: 'annonce',      label: 'Annonce & Photos' },
    { id: 'pricing',      label: 'Pricing' },
    { id: 'performance',  label: 'Performance' },
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
        if (state.step < 6) renderStep();
        else renderResults();
    }

    // ── Step shell ──────────────────────────────────────────────────────────
    function renderStep() {
        const total = STEPS.length;
        const s = state.step;
        const isLast = s === total - 1;
        const showSkip = s === 4;

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
            <!-- Title -->
            <h1 class="text-3xl font-bold text-primary mb-2">${stepTitle(s)}</h1>
            <p class="text-gray-500 text-sm mb-8 leading-relaxed">${stepSubtitle(s)}</p>
            <!-- Fields -->
            <div id="step-fields" class="space-y-6 mb-10">${stepFields(s)}</div>
            <!-- Nav -->
            <div class="flex gap-3">
                ${s > 0 ? `<button id="btn-back" class="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:border-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2">
                    <span class="material-icons-round text-sm">arrow_back</span> Retour
                </button>` : ''}
                ${!isLast
                    ? `<button id="btn-next" class="flex-1 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-lg">
                        Continuer <span class="material-icons-round text-sm">arrow_forward</span>
                      </button>`
                    : `<button id="btn-submit" class="flex-1 py-4 rounded-2xl bg-gold text-primary-dark font-bold hover:bg-[#c9a330] transition-all flex items-center justify-center gap-2 shadow-neon">
                        <span id="submit-label" class="flex items-center gap-2">Voir mon estimation <span class="material-icons-round text-sm">trending_up</span></span>
                        <span id="submit-spinner" class="hidden items-center gap-2"><svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg> Calcul en cours…</span>
                      </button>`
                }
            </div>
            ${showSkip ? `<button id="btn-skip" class="w-full mt-3 text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-2">Passer cette étape →</button>` : ''}
        `;

        bindStepEvents(s);
    }

    // ── Results ─────────────────────────────────────────────────────────────
    function renderResults() {
        const d   = state.data;
        const r   = projectRevenue(d);
        const monthlyMin = Math.round((r.rStd / 12) / 100) * 100;
        const monthlyMax = Math.round((r.rOpt / 12) / 100) * 100;
        const annualGap  = Math.max(0, Math.round((r.rOpt - r.rStd) / 100) * 100);

        // ── Score ──
        const { axes, score, optimised } = computeAuditScore(d);
        const verdict = score >= 75 ? 'Profil solide — optimisations ciblées possibles'
                      : score >= 58 ? 'Bon positionnement, des leviers restent actifs'
                      : score >= 40 ? 'Beau potentiel, plusieurs axes à développer'
                      : 'Fort potentiel inexploité';

        // ── Zone ──
        const zone = zoneAnalysis(d.zone);

        // ── Audit counter (localStorage, starts at 12) ──
        const auditCount = (() => {
            try {
                const stored  = parseInt(localStorage.getItem('kz_ac') || '12');
                const lastTs  = parseInt(localStorage.getItem('kz_ts') || '0');
                const now     = Date.now();
                if (now - lastTs > 4 * 3600 * 1000) {
                    const next = Math.min(stored + Math.floor(Math.random() * 3) + 1, 480);
                    localStorage.setItem('kz_ac', next);
                    localStorage.setItem('kz_ts', now);
                    return next;
                }
                return stored;
            } catch { return 12; }
        })();

        // ── Barnum diagnostic — 3 points based on weakest categories ──
        const MAXES = { pricing:25, trust:20, visuel:20, amenities:15, localisation:12, operationnel:8 };
        const BARNUM_TPL = {
            pricing:      { good:'Votre bien est bien positionné sur le marché',          weak:'votre politique tarifaire n\'est pas encore calibrée pour capturer les pics de demande — Carnaval, Yoles, haute saison — ni pour rentabiliser la basse saison avec des remises longue durée.' },
            trust:        { good:'Votre présence sur les plateformes est établie',         weak:'votre profil manque encore des signaux de confiance décisifs (Superhost, volume d\'avis, temps de réponse) qui déclenchent les réservations sans hésitation.' },
            visuel:       { good:'Votre annonce est en ligne et visible',                  weak:'la présentation visuelle laisse de l\'argent sur la table — photos, titre et description sont les premiers filtres des voyageurs avant même de regarder le prix.' },
            amenities:    { good:'Votre bien offre les essentiels attendus en Martinique', weak:'certains équipements différenciants pourraient vous positionner en tête des recherches filtrées et justifier un tarif supérieur de 15 à 30 %.' },
            localisation: { good:'Votre localisation présente un réel potentiel',          weak:'ce potentiel n\'est pas encore pleinement valorisé dans votre annonce — les atouts géographiques doivent être mis en avant explicitement pour convertir.' },
            operationnel: { good:'Votre organisation est fonctionnelle',                   weak:'quelques ajustements (check-in autonome, politique d\'annulation, multi-plateformes) pourraient débloquer une tranche de visibilité et de revenus supplémentaire.' },
        };
        const barnumPoints = Object.entries(axes)
            .map(([k, v]) => ({ k, pct: v / (MAXES[k] || 1) }))
            .sort((a, b) => a.pct - b.pct)
            .slice(0, 3)
            .map(({ k }) => BARNUM_TPL[k] || { good: 'Votre bien a des atouts solides', weak: 'certains leviers restent à activer.' });

        // ── Win catalog ──
        const WIN_CATALOG = [
            { key:'dynamic_pricing',     val:true,       icon:'price_change',   label:'Activer le pricing dynamique',            cond:d=>!d.dynamic_pricing,              locked:false, detail:"PriceLabs ou Beyond Pricing ajustent vos prix automatiquement. Retour sur investissement en moins d'un mois." },
            { key:'pro_photos',          val:true,       icon:'photo_camera',   label:'Photos professionnelles',                 cond:d=>!d.pro_photos,                   locked:false, detail:"Un shooting pro améliore le taux de conversion de 15–25%. Comptez 300–600€ pour un ROI en 2 semaines." },
            { key:'optimized_title',     val:true,       icon:'title',          label:'Optimiser le titre de l\'annonce',        cond:d=>!d.optimized_title,              locked:false, detail:"Intégrer «vue mer», «piscine», «plage» dans le titre augmente le CTR de 10–15%." },
            { key:'multi_platform_distribution', val:true, icon:'hub',          label:'Multi-diffusion (Booking, Vrbo…)',        cond:d=>!d.multi_platform_distribution,  locked:false, detail:"Chaque plateforme supplémentaire réduit les périodes creuses et lisse l'occupation annuelle." },
            { key:'seasonal_pricing',    val:true,       icon:'event',          label:'Tarification saisonnière',                cond:d=>!d.seasonal_pricing,             locked:false, detail:"Différencier haute/basse saison avec des écarts de 30–50% capte les pics de demande." },
            { key:'flexible_checkin',    val:true,       icon:'vpn_key',        label:'Check-in autonome (boîte à clés)',        cond:d=>!d.flexible_checkin,             locked:false, detail:"Améliore la conversion et ouvre la porte aux séjours longue durée." },
            { key:'long_description',    val:true,       icon:'description',    label:'Réécrire la description (500+ mots)',     cond:d=>!d.long_description,             locked:false, detail:"Une description structurée améliore la conversion de 5–8% et le référencement Airbnb." },
            { key:'cancellation_policy', val:'flexible', icon:'policy',         label:'Politique d\'annulation flexible',        cond:d=>d.cancellation_policy==='strict', locked:false, detail:"Passer en flexible augmente le taux de conversion de 15–20%, surtout sur Booking." },
            { key:'nb_photos_band',      val:'gte_25',   icon:'photo_library',  label:'Plus de photos (25 minimum)',             cond:d=>d.nb_photos_band==='lt_10'||d.nb_photos_band==='10_19', locked:false, detail:"Airbnb booste les annonces avec 25+ photos dans les résultats de recherche." },
            { key:'private_pool',        val:true,       icon:'pool',           label:'Piscine privée',                          cond:d=>!d.private_pool,                 locked:true,  detail:"Investissement structurant. L'Audit Pro chiffre le ROI exact et le délai d'amortissement." },
            { key:'hot_tub_jacuzzi',     val:true,       icon:'hot_tub',        label:'Jacuzzi / Bain à remous',                 cond:d=>d.private_pool&&!d.hot_tub_jacuzzi, locked:true, detail:"Différenciateur fort en clientèle premium. Impact direct sur l'ADR." },
            { key:'wifi_fiber',          val:true,       icon:'wifi',           label:'Fibre optique / Wifi stable',             cond:d=>!d.wifi_fiber,                   locked:true,  detail:"Clé pour attirer les digital nomads et les séjours 28+ nuits." },
        ];

        const candidates = WIN_CATALOG
            .filter(w => w.cond(d))
            .map(w => ({ ...w, gain: quickGain(w.key, w.val, d) }))
            .sort((a, b) => {
                if (a.locked !== b.locked) return a.locked ? 1 : -1;
                return b.gain - a.gain;
            });

        const freeWins  = candidates.filter(w => !w.locked).slice(0, 2);
        const lockedWins = candidates.filter(w => w.locked).slice(0, 2);

        // ── Helpers ──
        function pill(s, max) {
            const pct = s / max;
            return pct >= 0.75
                ? `<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full ml-auto shrink-0">Optimisé</span>`
                : pct >= 0.50
                ? `<span class="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full ml-auto shrink-0">À améliorer</span>`
                : `<span class="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full ml-auto shrink-0">Point faible</span>`;
        }

        const AXES_META = [
            { label: 'Pricing',          s: axes.pricing,      max: 25 },
            { label: 'Confiance',         s: axes.trust,        max: 20 },
            { label: 'Visuel & Annonce',  s: axes.visuel,       max: 20 },
            { label: 'Équipements',       s: axes.amenities,    max: 15 },
            { label: 'Localisation',      s: axes.localisation, max: 12 },
            { label: 'Opérationnel',      s: axes.operationnel, max:  8 },
        ];

        const axesHTML = AXES_META.map(({ label, s, max }) => `
            <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-[8.5rem] shrink-0">${label}</span>
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700 ${s/max>=0.75?'bg-emerald-400':s/max>=0.50?'bg-amber-400':'bg-red-400'}"
                         style="width:${Math.round(s/max*100)}%"></div>
                </div>
                <span class="text-xs font-bold text-gray-400 w-9 text-right shrink-0">${s}/${max}</span>
                ${pill(s, max)}
            </div>
        `).join('');

        function winCard(w) {
            const gainStr   = w.gain > 0 ? `+${fmt.format(w.gain)}/mois` : 'Impact fort';
            const gainColor = w.gain > 0 ? 'text-emerald-600' : 'text-amber-600';
            return `<div class="flex gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div class="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span class="material-icons-round text-gold text-base">${w.icon}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-0.5">
                        <span class="text-sm font-bold text-gray-800 leading-snug">${w.label}</span>
                        <span class="text-sm font-bold ${gainColor} shrink-0">${gainStr}</span>
                    </div>
                    <p class="text-xs text-gray-500 leading-relaxed">${w.detail}</p>
                </div>
            </div>`;
        }

        // ── 12-month bar chart (locked preview) ──
        const ci = toComputeInput(d);
        const rb = compute(ci);
        const monthRevs   = DAYS.map((days,i) => rb.adrWith * S_ADR[i] * days * rb.occWith * S_OCC_OPT[i]);
        const maxMonthRev = Math.max(...monthRevs);
        const MONTH_LABELS = ['J','F','M','A','M','J','J','A','S','O','N','D'];
        const barsHTML = monthRevs.map((rev, i) => {
            const h = Math.round(rev / maxMonthRev * 52);
            const color = h > 39 ? '#B8922A' : 'rgba(184,146,42,0.45)';
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
                <div style="width:100%;height:${h}px;background:${color};border-radius:3px 3px 0 0"></div>
                <span style="font-size:8px;color:#9ca3af">${MONTH_LABELS[i]}</span>
            </div>`;
        }).join('');

        // ── Score circle ──
        const circ   = 188;
        const filled = Math.round(circ * score / 100);
        const firstName = (window._auditContact?.name || '').split(' ')[0];

        // ── Unlock CTA reusable (3 occurrences) ──
        function unlockCTA(id, compact = false) {
            if (compact) return `
                <button id="${id}" class="unlock-btn w-full flex items-center justify-between bg-primary text-white rounded-2xl px-5 py-4 hover:bg-primary-light transition-all shadow-lg">
                    <div>
                        <p class="font-bold text-sm leading-tight">Débloquer mon Audit Pro</p>
                        <p class="text-white/50 text-xs">Plan d'action · Benchmark · Appel 30 min</p>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <span class="text-gray-400 text-xs line-through">99€</span>
                        <span class="text-gold font-bold">79€</span>
                        <span class="material-icons-round text-gold text-sm">arrow_forward</span>
                    </div>
                </button>`;
            return `
                <div class="flex items-baseline gap-2 mb-3 justify-center">
                    <span class="text-gray-400 text-sm line-through">99€</span>
                    <span class="text-primary font-bold text-2xl">79€</span>
                </div>
                <button id="${id}" class="unlock-btn squishy-btn w-full max-w-xs bg-gold text-primary-dark font-bold py-4 flex items-center justify-center gap-2">
                    Débloquer mon Audit Pro
                    <span class="material-icons-round text-sm">arrow_forward</span>
                </button>
                <p class="text-gray-400 text-xs mt-2 text-center">Livré sous 48h · Cyril vous contacte directement</p>`;
        }

        root.innerHTML = `
        <!-- Header bar -->
        <div class="mb-5">
            <div class="h-1.5 bg-gold rounded-full mb-5"></div>
            <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                    <span class="material-icons-round text-gold text-sm">check_circle</span>
                    <span class="text-xs font-bold uppercase tracking-widest text-gold">Diagnostic complété</span>
                </div>
                <span class="text-[10px] text-gray-400">${auditCount} audits réalisés</span>
            </div>
            <h1 class="text-2xl font-bold text-primary">${firstName ? `Votre audit, ${firstName}` : 'Votre audit'}</h1>
        </div>

        <!-- Score global -->
        <div class="bg-primary text-white rounded-3xl p-5 mb-4 flex items-center gap-5 shadow-xl">
            <div class="relative shrink-0" style="width:72px;height:72px">
                <svg width="72" height="72" viewBox="0 0 72 72" style="transform:rotate(-90deg)">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="5"/>
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#B8922A" stroke-width="5"
                        stroke-dasharray="${filled} ${circ - filled}" stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-xl font-bold text-white leading-none">${score}</span>
                    <span class="text-[9px] text-white/40 leading-none">/100</span>
                </div>
            </div>
            <div>
                <p class="font-bold text-base leading-snug mb-1">${verdict}</p>
                <p class="text-white/50 text-xs">${optimised}/6 axes au-dessus du seuil optimal</p>
            </div>
        </div>

        <!-- Sub-scores -->
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Analyse par catégorie</p>
            <div class="space-y-3">${axesHTML}</div>
        </div>

        <!-- Diagnostic Barnum -->
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Ce que votre annonce révèle</p>
            <div class="space-y-4">
                ${barnumPoints.map((pt, i) => `
                <div class="flex gap-3">
                    <div class="w-5 h-5 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span class="text-[10px] font-bold text-gold">${i+1}</span>
                    </div>
                    <p class="text-sm text-gray-600 leading-relaxed">
                        <span class="font-semibold text-gray-800">${pt.good}</span>
                        — mais ${pt.weak}
                    </p>
                </div>`).join('')}
            </div>
        </div>

        <!-- CTA #1 — inline compact -->
        <div class="mb-4">${unlockCTA('unlock-btn-1', true)}</div>

        <!-- Revenue estimate -->
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Estimation de revenus</p>
            <div class="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Situation actuelle</p>
                    <p class="text-2xl font-bold text-gray-700">${fmt.format(monthlyMin)}<span class="text-sm text-gray-400 font-normal">/mois</span></p>
                </div>
                <div>
                    <p class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Potentiel optimisé</p>
                    <p class="text-2xl font-bold text-gold">${fmt.format(monthlyMax)}<span class="text-sm text-gray-400 font-normal">/mois</span></p>
                </div>
            </div>
            <p class="text-[10px] text-gray-400 mb-3">Revenus bruts lissés sur l'année · estimation conservatrice</p>
            ${annualGap > 200 ? `<div class="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2">
                <span class="material-icons-round text-emerald-500 text-sm">trending_up</span>
                <p class="text-emerald-700 text-xs">Potentiel inexploité estimé : <span class="font-bold">+${fmt.format(annualGap)}/an</span></p>
            </div>` : ''}
        </div>

        <!-- Zone analysis -->
        <div class="bg-gold/5 border border-gold/15 rounded-3xl p-5 mb-4">
            <div class="flex items-center gap-2 mb-2">
                <span class="material-icons-round text-gold text-sm">place</span>
                <span class="text-[10px] font-bold text-gold uppercase tracking-wider">${zone.label}</span>
            </div>
            <p class="text-gray-700 text-sm leading-relaxed">${zone.text}</p>
        </div>

        <!-- Quick wins (free) -->
        ${freeWins.length ? `
        <div class="mb-4">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick wins identifiés</p>
            <div class="space-y-3">${freeWins.map(winCard).join('')}</div>
        </div>` : ''}

        <!-- Locked section — CTA #2 -->
        <div class="relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm mb-6">
            <div class="pointer-events-none select-none p-5 space-y-3 bg-white" style="filter:blur(10px);opacity:0.4">
                ${lockedWins.map(winCard).join('')}
                <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p style="font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Revenus estimés · 12 mois</p>
                    <div style="display:flex;align-items:flex-end;gap:3px;height:52px">${barsHTML}</div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                        <span class="text-xs text-gray-500">Prix optimal / nuit</span>
                        <span class="text-xs font-bold text-gray-800">${fmt.format(Math.round(rb.adrWith / 10) * 10)}</span>
                    </div>
                    <div class="flex justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                        <span class="text-xs text-gray-500">Écart vs. médiane zone</span>
                        <span class="text-xs font-bold text-emerald-600">+${Math.round((rb.adrWith / rb.adrW - 1) * 100)}% possible</span>
                    </div>
                    <div class="flex justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                        <span class="text-xs text-gray-500">Plan d'action</span>
                        <span class="text-xs font-bold text-gray-800">30 / 60 / 90 jours</span>
                    </div>
                </div>
            </div>
            <div class="absolute inset-0 flex flex-col items-center justify-center p-6"
                 style="background:linear-gradient(to bottom,rgba(253,252,248,0) 0%,rgba(253,252,248,0.96) 25%)">
                <div class="w-11 h-11 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center mb-3">
                    <span class="material-icons-round text-primary">lock</span>
                </div>
                <h4 class="text-primary font-bold text-lg text-center mb-1">Rapport Audit Pro</h4>
                <p class="text-gray-500 text-sm text-center mb-4 max-w-xs">Gains chiffrés · Revenus 12 mois · Benchmark · Plan d'action · Appel Cyril</p>
                <ul class="space-y-1.5 mb-5 self-stretch max-w-xs mx-auto">
                    <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Gain estimé pour chaque levier non activé</li>
                    <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Projection de revenus mois par mois (12 mois)</li>
                    <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Benchmark 15 concurrents directs dans votre zone</li>
                    <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Plan d'action 30/60/90 jours chiffré</li>
                    <li class="flex items-center gap-2 text-gray-600 text-xs"><span class="material-icons-round text-gold text-sm">check_circle</span>Appel 30 min avec Cyril</li>
                </ul>
                ${unlockCTA('unlock-audit-btn')}
            </div>
        </div>

        <!-- Testimonials -->
        <div class="mb-6">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Ce que disent nos propriétaires</p>
            <div class="space-y-3">
                <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div class="flex items-center gap-2.5 mb-2">
                        <div class="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                            <span class="text-xs font-bold text-gold">SL</span>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-800 leading-tight">Sophie L.</p>
                            <p class="text-[10px] text-gray-400">Les Trois-Îlets · Villa 4 ch.</p>
                        </div>
                        <div class="ml-auto text-gold text-xs tracking-tighter">★★★★★</div>
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">"J'ai appliqué les 3 premières recommandations du rapport. Mon taux d'occupation est passé de 48 % à 71 % en deux mois, sans baisser mes tarifs."</p>
                </div>
                <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div class="flex items-center gap-2.5 mb-2">
                        <div class="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                            <span class="text-xs font-bold text-gold">MB</span>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-800 leading-tight">Marc B.</p>
                            <p class="text-[10px] text-gray-400">Sainte-Anne · Villa 2 ch.</p>
                        </div>
                        <div class="ml-auto text-gold text-xs tracking-tighter">★★★★★</div>
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">"Cyril a revu mon titre et mes photos. Mon ADR a augmenté de 22 % en conservant le même taux d'occupation. Le rapport s'est amorti en une semaine."</p>
                </div>
                <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div class="flex items-center gap-2.5 mb-2">
                        <div class="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                            <span class="text-xs font-bold text-gold">NK</span>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-800 leading-tight">Nathalie K.</p>
                            <p class="text-[10px] text-gray-400">Le Diamant · Villa 3 ch.</p>
                        </div>
                        <div class="ml-auto text-gold text-xs tracking-tighter">★★★★★</div>
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">"Le plan d'action 30/60/90 jours m'a donné une feuille de route claire. En 6 mois, mes revenus ont doublé. Je recommande à tout propriétaire sérieux."</p>
                </div>
            </div>
        </div>

        <!-- CTA #3 — final avec réassurance -->
        <div class="bg-primary rounded-3xl p-6 mb-4 text-center shadow-xl">
            <p class="text-white/60 text-xs uppercase tracking-widest font-bold mb-2">${auditCount} propriétaires nous font confiance</p>
            <h3 class="text-white font-bold text-xl mb-1">Prêt à passer à l'action ?</h3>
            ${annualGap > 500
                ? `<p class="text-white/60 text-sm mb-5">79€ — le prix d'un dîner pour un plan d'action qui peut vous rapporter <span class="text-gold font-bold">+${fmt.format(annualGap)}/an</span></p>`
                : `<p class="text-white/60 text-sm mb-5">79€ — un investissement amorti dès la première semaine d'optimisation.</p>`
            }
            <button id="unlock-btn-3" class="unlock-btn w-full bg-gold hover:bg-[#c9a330] text-primary-dark font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-neon mb-5">
                Débloquer mon Audit Pro
                <span class="material-icons-round text-sm">arrow_forward</span>
            </button>
            <!-- Reassurance badges -->
            <div class="grid grid-cols-2 gap-2">
                <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <span class="material-icons-round text-gold text-sm">lock</span>
                    <span class="text-white/60 text-[11px]">Paiement sécurisé</span>
                </div>
                <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <span class="material-icons-round text-gold text-sm">schedule</span>
                    <span class="text-white/60 text-[11px]">Rapport sous 48h</span>
                </div>
                <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <span class="material-icons-round text-gold text-sm">task_alt</span>
                    <span class="text-white/60 text-[11px]">Actions clé en main</span>
                </div>
                <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <span class="material-icons-round text-gold text-sm">verified</span>
                    <span class="text-white/60 text-[11px]">Satisfait ou remboursé</span>
                </div>
            </div>
        </div>

        <!-- Restart -->
        <button id="btn-restart" class="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-3 mb-2">
            ← Recommencer avec un autre bien
        </button>
        `;

        window._kazasSimData = {
            zone: d.zone, commune: d.commune,
            bedrooms: d.bedrooms, bathrooms: d.bathrooms,
            private_pool: d.private_pool, ocean_view: d.ocean_view,
            monthly_min: monthlyMin, monthly_max: monthlyMax,
            annual_std: r.rStd, annual_opt: r.rOpt, score,
        };

        document.getElementById('btn-restart')?.addEventListener('click', () => {
            state.step = 0;
            render();
        });
        initUnlockBtn();
    }

    // ── Step titles ──────────────────────────────────────────────────────────
    function stepTitle(s) {
        return [
            'Où se situe votre bien ?',
            'Parlez-nous de votre villa',
            'Annonce & photos',
            'Pricing & distribution',
            'Performance actuelle',
            'Vos coordonnées',
        ][s] || '';
    }
    function stepSubtitle(s) {
        return [
            'Ces informations calibrent l\'estimation sur les données réelles du marché martiniquais.',
            'Plus votre bien est détaillé, plus l\'estimation sera précise.',
            'La présentation est le levier le plus rapide pour augmenter vos réservations.',
            'Le pricing dynamique est le levier n°1 — jusqu\'à +36 % de revenus.',
            'Ces données affinent le scoring. Vous pouvez passer si vous débutez.',
            'Cyril vous enverra votre estimation complète sous 48h.',
        ][s] || '';
    }

    // ── Step fields ──────────────────────────────────────────────────────────
    function stepFields(s) {
        const d = state.data;

        // ── STEP 0 — Localisation ──────────────────────────────────────────
        if (s === 0) {
            return `
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Commune</label>
                <div class="relative" id="commune-autocomplete">
                    <input id="commune-input" type="text" autocomplete="off"
                        placeholder="Tapez pour rechercher…" value="${d.commune}"
                        class="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-0 text-primary placeholder-gray-300 transition-all text-sm shadow-sm pr-10" />
                    <span class="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">search</span>
                    <div id="commune-dropdown"
                        class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-y-auto hidden"
                        style="max-height:220px">
                    </div>
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
        }

        // ── STEP 1 — Votre bien ────────────────────────────────────────────
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
                ${toggleRow('private_pool',     'Piscine privée',                    'À usage exclusif',               d.private_pool)}
                ${toggleRow('hot_tub_jacuzzi',  'Jacuzzi / Bain à remous',           '',                               d.hot_tub_jacuzzi)}
                ${toggleRow('ac_all_bedrooms',  'Climatisation dans toutes les chambres', '',                          d.ac_all_bedrooms)}
                ${toggleRow('wifi_fiber',       'Fibre optique / Wifi stable',       'Connexion ≥ 50 Mbps annoncée',   d.wifi_fiber)}
                ${toggleRow('home_office',      'Espace télétravail',                'Bureau, siège ergonomique',       d.home_office)}
                ${toggleRow('parking',          'Parking privé',                     '',                               d.parking)}
            </div>
        `;

        // ── STEP 2 — Annonce & Photos ──────────────────────────────────────
        if (s === 2) return `
            <div class="space-y-4">
                ${toggleRow('pro_photos', 'Photos professionnelles', 'Prises par un photographe dédié', d.pro_photos)}
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Nombre de photos dans l'annonce</label>
                <div class="grid grid-cols-2 gap-2" data-seg="nb_photos_band">
                    ${[['lt_10','Moins de 10'],['10_19','10 – 19'],['20_24','20 – 24'],['gte_25','25 et plus']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-3 rounded-2xl border text-sm font-medium transition-all ${d.nb_photos_band===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Photo de couverture</label>
                <div class="grid grid-cols-2 gap-2" data-seg="cover_type">
                    ${[['pool_ext','Piscine / Extérieur'],['sea_view','Vue mer'],['other','Jardin / Autre'],['interior','Intérieur']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-3 rounded-2xl border text-sm font-medium transition-all ${d.cover_type===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
                <p class="text-xs text-gray-400 mt-2">La photo de couverture influence 90 % des décisions de clic.</p>
            </div>
            <div class="space-y-4">
                ${toggleRow('optimized_title',   'Titre optimisé SEO',     'Contient «vue mer», «piscine», «plage» ou la commune', d.optimized_title)}
                ${toggleRow('long_description',  'Description +500 mots',  'Structurée, avec storytelling local',                  d.long_description)}
            </div>
        `;

        // ── STEP 3 — Pricing & Distribution ───────────────────────────────
        if (s === 3) return `
            <div class="space-y-4">
                ${toggleRow('dynamic_pricing',     'Pricing dynamique',           'PriceLabs, Beyond Pricing ou équivalent',        d.dynamic_pricing)}
                ${toggleRow('seasonal_pricing',    'Tarification saisonnière',    'Prix haute/basse saison différenciés',            d.seasonal_pricing)}
                ${toggleRow('event_pricing',       'Tarification événementielle', 'Yoles, Carnaval, Pâques, Toussaint majorés',     d.event_pricing)}
                ${toggleRow('long_stay_discounts', 'Remises longue durée',        '−10% semaine, −30% mois — pour combler le creux', d.long_stay_discounts)}
                ${toggleRow('multi_platform_distribution', 'Diffusion multi-plateformes', 'Airbnb + Booking.com + Abritel / Vrbo',  d.multi_platform_distribution)}
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Durée minimale de séjour</label>
                <div class="grid grid-cols-3 gap-2" data-seg="min_nights_band">
                    ${[['1_2','1 – 2 nuits'],['3_4','3 – 4 nuits'],['gte_5','5 nuits+']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-2.5 rounded-2xl border text-xs font-medium transition-all ${d.min_nights_band===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
            </div>
        `;

        // ── STEP 4 — Performance & Ops ────────────────────────────────────
        if (s === 4) return `
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Note moyenne actuelle</label>
                <div class="grid grid-cols-3 gap-2" data-seg="review_score_band">
                    ${[['lt_4_6','< 4.6'],['4_6_to_4_79','4.6 – 4.8'],['gte_4_8','≥ 4.8']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-3 rounded-2xl border text-sm font-medium transition-all ${d.review_score_band===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
                <p class="text-xs text-gray-400 mt-2">Pas encore de note ? Choisissez «&lt; 4.6».</p>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Nombre d'avis</label>
                <div class="grid grid-cols-2 gap-2" data-seg="nb_reviews_band">
                    ${[['lt_5','Moins de 5'],['5_19','5 – 19'],['20_49','20 – 49'],['gte_50','50 et plus']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-3 rounded-2xl border text-sm font-medium transition-all ${d.nb_reviews_band===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Taux de réponse</label>
                <div class="grid grid-cols-3 gap-2" data-seg="response_rate">
                    ${[['fast','< 1 heure'],['normal','Quelques h'],['slow','> 24 h']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-3 rounded-2xl border text-sm font-medium transition-all ${d.response_rate===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">Politique d'annulation</label>
                <div class="grid grid-cols-3 gap-2" data-seg="cancellation_policy">
                    ${[['flexible','Flexible'],['moderate','Modérée'],['strict','Stricte']].map(([v,l]) =>
                        `<button data-value="${v}" class="seg-btn py-3 rounded-2xl border text-sm font-medium transition-all ${d.cancellation_policy===v?'bg-primary text-white border-primary shadow-sm':'border-gray-200 text-gray-600 hover:border-gray-400'}">${l}</button>`
                    ).join('')}
                </div>
            </div>
            <div class="space-y-4">
                ${toggleRow('superhost',        'Statut Superhost',          'Badge Airbnb actif',                            d.superhost)}
                ${toggleRow('flexible_checkin', 'Check-in autonome',         'Boîte à clés, code, ou remise sans RDV fixe',   d.flexible_checkin)}
                ${toggleRow('welcome_pack',     'Welcome pack local',        'Rhum, confitures, carte de la région…',          d.welcome_pack)}
            </div>
        `;

        // ── STEP 5 — Contact ──────────────────────────────────────────────
        if (s === 5) return `
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

    // ── Toggle helpers ───────────────────────────────────────────────────────
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

    // ── Event binding ────────────────────────────────────────────────────────
    function bindStepEvents(s) {

        // Commune autocomplete (step 0 only)
        if (s === 0) {
            const communeInput    = document.getElementById('commune-input');
            const communeDropdown = document.getElementById('commune-dropdown');
            const sorted = [...COMMUNES].sort((a, b) => a.label.localeCompare(b.label, 'fr'));

            function filterCommunes(q) {
                const norm = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return sorted.filter(c =>
                    c.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm)
                );
            }

            function showDropdown(q) {
                const matches = filterCommunes(q);
                communeDropdown.innerHTML = matches.length
                    ? matches.map(c =>
                        `<button type="button" data-commune="${c.label}"
                            class="commune-opt w-full text-left px-4 py-3 text-sm text-primary hover:bg-gold/5 font-medium border-b border-gray-50 last:border-0 transition-colors">${c.label}</button>`
                      ).join('')
                    : `<div class="px-4 py-3 text-sm text-gray-400">Aucune commune trouvée</div>`;
                communeDropdown.classList.remove('hidden');
                communeDropdown.querySelectorAll('.commune-opt').forEach(opt => {
                    opt.addEventListener('mousedown', (e) => {
                        e.preventDefault(); // keep focus on input, prevent blur
                        const label = opt.dataset.commune;
                        communeInput.value = label;
                        state.data.commune = label;
                        state.data.zone = communeInfo(label).zone;
                        communeDropdown.classList.add('hidden');
                    });
                });
            }

            if (communeInput) {
                communeInput.addEventListener('input',  () => showDropdown(communeInput.value));
                communeInput.addEventListener('focus',  () => showDropdown(communeInput.value));
                communeInput.addEventListener('blur',   () => {
                    // slight delay so mousedown on option fires first
                    setTimeout(() => {
                        communeDropdown.classList.add('hidden');
                        // revert to last valid value if input doesn't match
                        const match = sorted.find(
                            c => c.label.toLowerCase() === communeInput.value.toLowerCase().trim()
                        );
                        if (match) {
                            communeInput.value = match.label;
                            state.data.commune = match.label;
                            state.data.zone = match.zone;
                        } else {
                            communeInput.value = state.data.commune;
                        }
                    }, 150);
                });
                communeInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') communeDropdown.classList.add('hidden');
                });
            }
        }

        // Segmented buttons
        root.querySelectorAll('[data-seg]').forEach(group => {
            const key = group.dataset.seg;
            group.querySelectorAll('.seg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    state.data[key] = btn.dataset.value;
                    group.querySelectorAll('.seg-btn').forEach(b => {
                        b.className = b.className
                            .replace('bg-primary text-white border-primary shadow-sm',
                                     'border-gray-200 text-gray-600 hover:border-gray-400');
                    });
                    btn.className = btn.className
                        .replace('border-gray-200 text-gray-600 hover:border-gray-400',
                                 'bg-primary text-white border-primary shadow-sm');
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

        // Skip (step 4 — Performance)
        document.getElementById('btn-skip')?.addEventListener('click', () => {
            state.step++;
            render();
            scrollToTop();
        });

        // Submit (step 5 — Contact)
        document.getElementById('btn-submit')?.addEventListener('click', async () => {
            const name  = document.getElementById('contact-name')?.value?.trim();
            const email = document.getElementById('contact-email')?.value?.trim();
            const phone = document.getElementById('contact-phone')?.value?.trim();
            const url   = document.getElementById('contact-url')?.value?.trim() || '';

            if (!name || !email || !phone) {
                alert('Veuillez remplir votre nom, email et téléphone.');
                return;
            }

            window._auditContact = { name, email, phone, url };

            // Spinner
            const label   = document.getElementById('submit-label');
            const spinner = document.getElementById('submit-spinner');
            const btn     = document.getElementById('btn-submit');
            if (btn) btn.disabled = true;
            label?.classList.add('hidden');
            spinner?.classList.remove('hidden');
            spinner?.classList.add('flex');

            // Pre-fill paywall modal
            ['audit-name','audit-email','audit-phone','audit-url'].forEach((id, i) => {
                const el = document.getElementById(id);
                if (el) el.value = [name, email, phone, url][i];
            });

            // Compute & send
            const r = projectRevenue(state.data);
            const { score } = computeAuditScore(state.data);
            const monthlyMin = Math.round((r.rStd / 12) / 100) * 100;
            const monthlyMax = Math.round((r.rOpt / 12) / 100) * 100;
            const simPayload = {
                commune: state.data.commune, zone: state.data.zone,
                bedrooms: state.data.bedrooms, bathrooms: state.data.bathrooms,
                private_pool: state.data.private_pool, ocean_view: state.data.ocean_view,
                monthly_min: monthlyMin, monthly_max: monthlyMax,
                annual_std: r.rStd, annual_opt: r.rOpt, score,
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

            setTimeout(() => {
                state.step = 6;
                render();
                scrollToTop();
            }, 600);
        });
    }

    // ── Paywall / unlock btn ──────────────────────────────────────────────────
    function initUnlockBtn() {
        document.querySelectorAll('.unlock-btn, #unlock-audit-btn, #unlock-audit-btn-2').forEach(btn => {
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
