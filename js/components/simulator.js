/**
 * CasasSimulatorEngineLight v1
 * Dual-scenario: without_casas (valeur brute) vs with_casas (headroom boost).
 */
export function initSimulator() {
    // ═══ CAPS ═══
    const CAPS = {
        ADR_floor: 90, ADR_cap: 1200, ADR_hard_cap: 1400,
        OCC_floor: 0.15, OCC_cap: 0.92, OCC_hard_cap: 0.95,
        ADR_pct_min: -25, ADR_pct_max: 60,
        OCC_pct_min: -30, OCC_pct_max: 35
    };

    // ═══ ZONE BASES (ADR_base € / OCC_base ratio) ═══
    const ZONE = {
        Sud_Caraibes: { adr: 260, occ: 0.55 },
        Sud_Atlantique: { adr: 230, occ: 0.50 },
        Nord_Caraibes: { adr: 210, occ: 0.48 },
        Nord_Atlantique: { adr: 190, occ: 0.45 }
    };

    // ═══ BOOST MODEL ═══
    const ALPHA = 1.25, BETA = 1.35;

    // ═══ HARD LEVER WEIGHTS (property-intrinsic) ═══
    const H_OV = { none: { a: 0, o: 0 }, partial: { a: 6, o: 2 }, dominant: { a: 14, o: 4 } };
    const H_BOOL = {
        beach_walkable: { a: 10, o: 5 }, private_pool: { a: 10, o: 4 },
        hot_tub_jacuzzi: { a: 18, o: 2 }, ac_all_bedrooms: { a: 7, o: 7 }
    };
    const BED_U = { a: 6, o: 2 }, BATH_U = { a: 4, o: 1 };
    const REF_BED = 3, REF_BATH = 2;

    // ═══ CASAS LEVER WEIGHTS (7 levers) ═══
    const CW = {
        wifi_quality: {
            poor: { a: -3, o: -6 }, ok: { a: 0, o: 0 }, good: { a: 1, o: 3 }, excellent: { a: 2, o: 6 }
        },
        pro_photos: { f: { a: 0, o: 0 }, t: { a: 3, o: 8 } },
        amenities_fully_tagged: { f: { a: 0, o: 0 }, t: { a: 0, o: 4 } },
        review_score_band: {
            lt_4_6: { a: -3, o: -8 }, '4_6_to_4_79': { a: 2, o: 4 }, gte_4_8: { a: 4, o: 8 }
        },
        dynamic_pricing_enabled: { f: { a: 0, o: 0 }, t: { a: 4, o: 2 } },
        min_nights_band: {
            '1_2': { a: 0, o: 3 }, '3_4': { a: 1, o: 1 }, gte_5: { a: 2, o: -4 }
        },
        multi_platform_distribution: { f: { a: 0, o: 0 }, t: { a: 1, o: 6 } }
    };

    // Evaluate one casas lever
    function evalCL(key, val) {
        const w = CW[key]; if (!w) return { a: 0, o: 0 };
        if (typeof val === 'boolean') return val ? (w.t || { a: 0, o: 0 }) : (w.f || { a: 0, o: 0 });
        return w[val] || { a: 0, o: 0 };
    }

    // ═══ PRESETS ═══
    const P_WITHOUT = {
        pro_photos: false, amenities_fully_tagged: false,
        dynamic_pricing_enabled: false, multi_platform_distribution: false,
        wifi_quality: 'good', min_nights_band: '3_4', review_score_band: '4_6_to_4_79'
    };
    const P_WITH = {
        pro_photos: true, amenities_fully_tagged: true,
        dynamic_pricing_enabled: true, multi_platform_distribution: true,
        wifi_quality: 'excellent', min_nights_band: '1_2', review_score_band: 'gte_4_8'
    };

    // UI-exposed casas lever keys (user can change these)
    const UI_CASAS = ['wifi_quality', 'pro_photos', 'review_score_band', 'min_nights_band', 'multi_platform_distribution'];

    // ═══ SEASONALITY ═══
    const S_ADR = [1.40, 1.50, 1.30, 1.20, 0.70, 0.65, 1.10, 1.15, 0.95, 0.75, 0.85, 1.45];
    const S_OCC_STD = [1.10, 1.15, 1.05, 1.00, 0.75, 0.70, 1.00, 1.05, 0.85, 0.70, 0.80, 1.20];
    const S_OCC_OPT = [1.15, 1.20, 1.12, 1.08, 0.85, 0.80, 1.10, 1.15, 0.95, 0.85, 0.90, 1.25];
    const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // ═══ DOM ═══
    const $ = id => document.getElementById(id);
    const seg = {
        zone: $('sim-zone-group'), ov: $('sim-ocean-view-group'),
        wifi: $('sim-wifi-group'), rev: $('sim-review-group'), mn: $('sim-min-nights-group')
    };
    const sl = { bed: $('sim-bedrooms'), bath: $('sim-bathrooms') };
    const slV = { bed: $('sim-bedrooms-value'), bath: $('sim-bathrooms-value') };
    const tg = {
        beach: $('sim-beach-walkable'), pool: $('sim-private-pool'),
        tub: $('sim-hot-tub'), ac: $('sim-ac'),
        photos: $('sim-pro-photos'), multi: $('sim-multi-platform')
    };
    const out = {
        revK: $('sim-revenue-display'), revS: $('sim-market-display'),
        prS: $('sim-price-standard'), ocS: $('sim-occupancy-standard'),
        prK: $('sim-price-kazas'), ocK: $('sim-occupancy-kazas'),
        impacts: $('sim-impacts-list')
    };
    const advBtn = $('sim-toggle-advanced'), advP = $('sim-advanced-options'), advI = $('sim-toggle-icon');
    if (!out.revK) return;

    // ═══ HELPERS ═══
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const segVal = g => { if (!g) return null; const a = g.querySelector('.sim-seg-active'); return a ? a.dataset.value : null; };

    function initSeg(g) {
        if (!g) return;
        g.querySelectorAll('.sim-seg-btn').forEach(b => {
            b.addEventListener('click', () => {
                g.querySelectorAll('.sim-seg-btn').forEach(x => x.classList.remove('sim-seg-active'));
                b.classList.add('sim-seg-active');
                update();
            });
        });
    }

    function fillSlider(s) {
        if (!s) return;
        const p = (s.value - s.min) / (s.max - s.min) * 100;
        s.style.background = `linear-gradient(to right,#D4AF37 0%,#D4AF37 ${p}%,rgba(255,255,255,0.1) ${p}%,rgba(255,255,255,0.1) 100%)`;
    }

    // ═══ COLLECT INPUTS ═══
    function inputs() {
        return {
            zone: segVal(seg.zone) || 'Sud_Caraibes',
            ocean_view: segVal(seg.ov) || 'none',
            bedrooms: parseInt(sl.bed.value),
            bathrooms: parseInt(sl.bath.value),
            beach_walkable: tg.beach.checked,
            private_pool: tg.pool.checked,
            hot_tub_jacuzzi: tg.tub.checked,
            ac_all_bedrooms: tg.ac.checked,
            // UI-exposed casas levers
            wifi_quality: segVal(seg.wifi) || 'ok',
            review_score_band: segVal(seg.rev) || '4_6_to_4_79',
            min_nights_band: segVal(seg.mn) || '1_2',
            pro_photos: tg.photos.checked,
            multi_platform_distribution: tg.multi.checked
        };
    }

    // ═══ COMPUTE ═══
    function compute(inp) {
        const base = ZONE[inp.zone] || ZONE.Sud_Caraibes;

        // ── Step 1: Hard lever uplifts ──
        let hA = 0, hO = 0;
        const ov = H_OV[inp.ocean_view] || { a: 0, o: 0 };
        hA += ov.a; hO += ov.o;
        for (const [k, w] of Object.entries(H_BOOL)) {
            if (inp[k]) { hA += w.a; hO += w.o; }
        }
        hA += (inp.bedrooms - REF_BED) * BED_U.a;
        hO += (inp.bedrooms - REF_BED) * BED_U.o;
        hA += (inp.bathrooms - REF_BATH) * BATH_U.a;
        hO += (inp.bathrooms - REF_BATH) * BATH_U.o;

        // ── Step 1b: Casas lever uplifts ──
        // Without: use preset defaults, override with user's UI selections
        const cWithout = { ...P_WITHOUT };
        UI_CASAS.forEach(k => { if (inp[k] !== undefined) cWithout[k] = inp[k]; });
        let cA_w = 0, cO_w = 0;
        for (const [k, v] of Object.entries(cWithout)) {
            const r = evalCL(k, v); cA_w += r.a; cO_w += r.o;
        }

        // With: always use optimized overrides
        let cA_opt = 0, cO_opt = 0;
        for (const [k, v] of Object.entries(P_WITH)) {
            const r = evalCL(k, v); cA_opt += r.a; cO_opt += r.o;
        }

        // ── Step 2: WITHOUT CASAS ──
        const adrPctW = clamp(hA + cA_w, CAPS.ADR_pct_min, CAPS.ADR_pct_max);
        const occPctW = clamp(hO + cO_w, CAPS.OCC_pct_min, CAPS.OCC_pct_max);
        const adrW = clamp(base.adr * (1 + adrPctW / 100), CAPS.ADR_floor, CAPS.ADR_cap);
        const occW = clamp(base.occ * (1 + occPctW / 100), CAPS.OCC_floor, CAPS.OCC_cap);

        // ── Step 3: WITH CASAS (headroom boost) ──
        const adrHead = Math.max(0, ((CAPS.ADR_cap - adrW) / adrW) * 100);
        const occHead = Math.max(0, ((CAPS.OCC_cap - occW) / occW) * 100);

        const adrBoost = Math.min(cA_opt * ALPHA, adrHead);
        const occBoost = Math.min(cO_opt * BETA, occHead);

        // With Casas: no pct ceiling — headroom + absolute caps prevent over-promising
        const adrPctWith = Math.max(CAPS.ADR_pct_min, hA + adrBoost);
        const occPctWith = Math.max(CAPS.OCC_pct_min, hO + occBoost);
        const adrWith = clamp(base.adr * (1 + adrPctWith / 100), CAPS.ADR_floor, CAPS.ADR_cap);
        const occWith = clamp(base.occ * (1 + occPctWith / 100), CAPS.OCC_floor, CAPS.OCC_cap);

        return { adrW, occW, adrWith, occWith };
    }

    // ═══ FORMAT ═══
    const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    const fmtN = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

    // ═══ UPDATE ═══
    function update() {
        const inp = inputs();
        slV.bed.textContent = inp.bedrooms;
        slV.bath.textContent = inp.bathrooms;
        Object.values(sl).forEach(fillSlider);

        const r = compute(inp);

        // Monthly revenue with seasonality
        const mStd = [], mOpt = [];
        let rStd = 0, rOpt = 0;
        for (let i = 0; i < 12; i++) {
            const ms = Math.round(r.adrW * S_ADR[i] * DAYS[i] * r.occW * S_OCC_STD[i]);
            const mo = Math.round(r.adrWith * S_ADR[i] * DAYS[i] * r.occWith * S_OCC_OPT[i]);
            mStd.push(ms); mOpt.push(mo);
            rStd += ms; rOpt += mo;
        }

        // Display results
        out.revK.textContent = fmt.format(rOpt);
        out.revS.textContent = fmt.format(rStd);
        if (out.prS) out.prS.textContent = fmt.format(r.adrW);
        if (out.ocS) out.ocS.textContent = `${Math.round(r.occW * 100)}%`;
        if (out.prK) out.prK.textContent = fmt.format(r.adrWith);
        if (out.ocK) out.ocK.textContent = `${Math.round(r.occWith * 100)}%`;

        // Impacts list — Casas-specific advantages
        if (out.impacts) {
            const impacts = [];
            // Compare each casas lever: current vs optimized
            const pairs = [
                { key: 'pro_photos', label: 'Photos & annonce pro', from: P_WITHOUT.pro_photos, to: P_WITH.pro_photos },
                { key: 'amenities_fully_tagged', label: 'Équipements tagués', from: P_WITHOUT.amenities_fully_tagged, to: P_WITH.amenities_fully_tagged },
                { key: 'dynamic_pricing_enabled', label: 'Pricing dynamique', from: P_WITHOUT.dynamic_pricing_enabled, to: P_WITH.dynamic_pricing_enabled },
                { key: 'multi_platform_distribution', label: 'Multi-plateformes', from: P_WITHOUT.multi_platform_distribution, to: P_WITH.multi_platform_distribution },
                { key: 'review_score_band', label: 'Note ≥ 4.8 garantie', from: P_WITHOUT.review_score_band, to: P_WITH.review_score_band },
                { key: 'wifi_quality', label: 'Wi-Fi excellent', from: P_WITHOUT.wifi_quality, to: P_WITH.wifi_quality }
            ];
            pairs.forEach(p => {
                const from = evalCL(p.key, p.from), to = evalCL(p.key, p.to);
                const dA = to.a - from.a, dO = to.o - from.o;
                if (dA > 0 || dO > 0) {
                    impacts.push({ label: p.label, adr: `+${dA}%`, occ: `+${dO}%` });
                }
            });
            out.impacts.innerHTML = '';
            impacts.forEach(im => {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center text-[10px] text-white/80';
                li.innerHTML = `<span>${im.label}</span><span class="font-bold text-gold bg-gold/10 px-1 rounded">${im.adr} Prix / ${im.occ} Occup.</span>`;
                out.impacts.appendChild(li);
            });
        }

        renderChart(mStd, mOpt);
    }

    // ═══ CHART ═══
    function renderChart(mStd, mOpt) {
        const c = $('sim-monthly-chart');
        if (!c) return;
        const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const mx = Math.max(...mOpt, ...mStd);
        const mxF = fmtN.format(mx);

        let h = '<div class="relative">';
        h += `<div class="absolute inset-0 flex flex-col justify-between pointer-events-none" style="height:160px;">`;
        h += `<div class="border-b border-white/5 flex items-center"><span class="text-[7px] text-white/30 -ml-1">${mxF}€</span></div>`;
        h += '<div class="border-b border-white/5"></div><div class="border-b border-white/5"></div><div class="border-b border-white/5"></div></div>';
        h += '<div class="flex items-end justify-between gap-1 relative" style="height:160px;">';

        for (let i = 0; i < 12; i++) {
            const sH = mx > 0 ? (mStd[i] / mx) * 100 : 0;
            const oH = mx > 0 ? (mOpt[i] / mx) * 100 : 0;
            const sV = fmtN.format(mStd[i]);
            const oV = fmtN.format(mOpt[i]);
            h += `<div class="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                <div class="flex gap-[2px] items-end w-full justify-center relative" style="height:calc(100% - 18px);">
                    <div class="w-[38%] bg-white/15 hover:bg-white/25 rounded-t-sm transition-all relative cursor-pointer group/b1" style="height:${sH}%;">
                        <div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/b1:opacity-100 transition-opacity bg-black/80 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">${sV}€</div>
                    </div>
                    <div class="w-[38%] bg-gold hover:bg-gold/80 rounded-t-sm shadow-[0_0_6px_rgba(212,175,55,0.3)] transition-all relative cursor-pointer group/b2" style="height:${oH}%;">
                        <div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/b2:opacity-100 transition-opacity bg-gold/90 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">${oV}€</div>
                    </div>
                </div>
                <span class="text-[8px] text-white/40 font-mono leading-none">${labels[i]}</span>
            </div>`;
        }
        h += '</div>';
        h += `<div class="flex justify-center gap-4 mt-2">
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 bg-white/15 rounded-sm"></div><span class="text-[9px] text-white/40">Sans Casas</span></div>
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 bg-gold rounded-sm"></div><span class="text-[9px] text-gold/60">Avec Casas</span></div>
        </div>`;
        c.innerHTML = h;
    }

    // ═══ EVENTS ═══
    Object.values(seg).forEach(initSeg);
    Object.values(sl).forEach(s => { if (s) s.addEventListener('input', update); });
    Object.values(tg).forEach(t => { if (t) t.addEventListener('change', update); });

    if (advBtn && advP && advI) {
        advBtn.addEventListener('click', () => {
            advP.classList.toggle('hidden');
            advI.style.transform = advP.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    }

    // ═══ INIT ═══
    update();
}
