// ----- conversion rates loaded from config.json -----
let CONFIG = null;
let CONFIG_NETLIFY = null;
let CONFIG_VERCEL = null;
let CONFIG_RENDER = null;

// Netlify rates
let CREDITS_PER_AI_DOLLAR = 180;
let CREDITS_PER_GBH = 5;
let CREDITS_PER_10K_REQUESTS = 3;
let CREDITS_PER_GB_BW = 10;
let CREDITS_PER_FORM = 1;
let CREDITS_PER_DEPLOY = 15;
let PRICING_TIERS = [];
let OVERAGE_CONFIG = {};

// ----- storage constants -----
const STORAGE_KEY = 'netlify_calc_state';
const URL_PARAM_NAMES = ['ai', 'compute', 'req', 'bw', 'form', 'deploy', 'fnInvoc', 'isr', 'imgOpt', 'storage', 'privLink'];

// ----- filter state -----
let activeProviderFilter = 'all';

// ----- load configuration from config.json -----
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) throw new Error('Failed to load config');
        CONFIG = await response.json();

        // Extract provider configs
        CONFIG_NETLIFY = CONFIG.netlify;
        CONFIG_VERCEL = CONFIG.vercel;
        CONFIG_RENDER = CONFIG.render;

        // Update Netlify conversion rates from config
        CREDITS_PER_AI_DOLLAR = CONFIG_NETLIFY.conversionRates.ai.creditsPerUnit;
        CREDITS_PER_GBH = CONFIG_NETLIFY.conversionRates.compute.creditsPerUnit;
        CREDITS_PER_10K_REQUESTS = CONFIG_NETLIFY.conversionRates.requests.creditsPerUnit;
        CREDITS_PER_GB_BW = CONFIG_NETLIFY.conversionRates.bandwidth.creditsPerUnit;
        CREDITS_PER_FORM = CONFIG_NETLIFY.conversionRates.forms.creditsPerUnit;
        CREDITS_PER_DEPLOY = CONFIG_NETLIFY.conversionRates.deploys.creditsPerUnit;
        PRICING_TIERS = CONFIG_NETLIFY.pricingTiers;
        OVERAGE_CONFIG = CONFIG_NETLIFY.overageCost;
    } catch (e) {
        console.error('Error loading config.json:', e);
        // Fallback to defaults already set above
    }
}

// ----- preset scenarios -----
const PRESETS = {
    blog: {
        name: 'Personal Blog',
        ai: 0,
        compute: 2,
        req: 1,
        bw: 1,
        form: 5,
        deploy: 5,
        fnInvoc: 0.3,
        isr: 2,
        imgOpt: 3,
        storage: 0.2,
        privLink: 0.5
    },
    saas_small: {
        name: 'Simple SaaS (<1000 users)',
        ai: 8,
        compute: 25,
        req: 40,
        bw: 15,
        form: 200,
        deploy: 10,
        fnInvoc: 5,
        isr: 20,
        imgOpt: 50,
        storage: 10,
        privLink: 30
    },
    saas_large: {
        name: 'Major SaaS (100K users)',
        ai: 200,
        compute: 300,
        req: 5000,
        bw: 500,
        form: 50000,
        deploy: 50,
        fnInvoc: 100,
        isr: 200,
        imgOpt: 1000,
        storage: 300,
        privLink: 1000
    }
};

// ----- DOM elements -----
const aiRange = document.getElementById('aiRange');
const aiNumber = document.getElementById('aiNumber');
const aiCredSpan = document.getElementById('aiCredits');

const computeRange = document.getElementById('computeRange');
const computeNumber = document.getElementById('computeNumber');
const computeCredSpan = document.getElementById('computeCredits');

const reqRange = document.getElementById('reqRange');
const reqNumber = document.getElementById('reqNumber');
const reqCredSpan = document.getElementById('reqCredits');

const bwRange = document.getElementById('bwRange');
const bwNumber = document.getElementById('bwNumber');
const bwCredSpan = document.getElementById('bwCredits');

const formRange = document.getElementById('formRange');
const formNumber = document.getElementById('formNumber');
const formCredSpan = document.getElementById('formCredits');

const deployRange = document.getElementById('deployRange');
const deployNumber = document.getElementById('deployNumber');
const deployCredSpan = document.getElementById('deployCredits');

const totalSpan = document.getElementById('totalCredits');
const fillBar = document.getElementById('fillBar');
const planHint = document.getElementById('planHint');
const costSpan = document.getElementById('estimatedCost');

// ----- New provider-specific input elements -----
const fnInvocRange = document.getElementById('fnInvocRange');
const fnInvocNumber = document.getElementById('fnInvocNumber');

const isrRange = document.getElementById('isrRange');
const isrNumber = document.getElementById('isrNumber');

const imgOptRange = document.getElementById('imgOptRange');
const imgOptNumber = document.getElementById('imgOptNumber');

const storageRange = document.getElementById('storageRange');
const storageNumber = document.getElementById('storageNumber');

const privLinkRange = document.getElementById('privLinkRange');
const privLinkNumber = document.getElementById('privLinkNumber');

// ----- New provider results elements -----
const netlifyCreditsSpan = document.getElementById('netlifyCredits');
const netlifyPlanSpan = document.getElementById('netlifyPlan');
const netlifyMonthlyCostSpan = document.getElementById('netlifyMonthly');

const vercelCreditsSpan = document.getElementById('vercelCredits');
const vercelPlanSpan = document.getElementById('vercelPlan');
const vercelMonthlyCostSpan = document.getElementById('vercelMonthly');

const renderCreditsSpan = document.getElementById('renderCredits');
const renderPlanSpan = document.getElementById('renderPlan');
const renderMonthlyCostSpan = document.getElementById('renderMonthly');

// ----- Filter DOM cache -----
const allMeterRows = document.querySelectorAll('.meter-row');
const allCategoryGroups = document.querySelectorAll('.category-group');
const allFilterTabs = document.querySelectorAll('.filter-tab');

// ----- Filter Function -----
function filterByProvider(provider) {
    activeProviderFilter = provider;

    // Update filter tab active states
    allFilterTabs.forEach(tab => {
        tab.classList.remove('is-active');
    });
    const activeTab = document.querySelector(`.filter-tab[onclick="filterByProvider('${provider}')"]`);
    if (activeTab) {
        activeTab.classList.add('is-active');
    }

    // Filter meter rows
    allMeterRows.forEach(row => {
        const providers = row.getAttribute('data-providers');
        if (!providers) {
            row.classList.remove('is-hidden');
            return;
        }

        if (provider === 'all') {
            row.classList.remove('is-hidden');
        } else {
            const providerArray = providers.split(' ');
            if (providerArray.includes(provider)) {
                row.classList.remove('is-hidden');
            } else {
                row.classList.add('is-hidden');
            }
        }
    });

    // Hide empty category groups
    allCategoryGroups.forEach(group => {
        const visibleRows = group.querySelectorAll('.meter-row:not(.is-hidden)');
        if (visibleRows.length === 0) {
            group.classList.add('is-empty');
        } else {
            group.classList.remove('is-empty');
        }
    });
}

// ----- URL and Storage Functions -----
function saveToURL(values) {
    const params = new URLSearchParams();
    params.set('ai', values.ai.toFixed(2));
    params.set('compute', values.compute.toFixed(1));
    params.set('req', values.req.toFixed(0));
    params.set('bw', values.bw.toFixed(1));
    params.set('form', values.form.toFixed(0));
    params.set('deploy', values.deploy.toFixed(0));
    params.set('fnInvoc', values.fnInvoc.toFixed(1));
    params.set('isr', values.isr.toFixed(0));
    params.set('imgOpt', values.imgOpt.toFixed(0));
    params.set('storage', values.storage.toFixed(1));
    params.set('privLink', values.privLink.toFixed(1));
    window.history.replaceState(null, '', '?' + params.toString());
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('ai')) {
        return {
            ai: parseFloat(params.get('ai')) || 0,
            compute: parseFloat(params.get('compute')) || 0,
            req: parseFloat(params.get('req')) || 0,
            bw: parseFloat(params.get('bw')) || 0,
            form: parseFloat(params.get('form')) || 0,
            deploy: parseFloat(params.get('deploy')) || 0,
            fnInvoc: parseFloat(params.get('fnInvoc')) || 0,
            isr: parseFloat(params.get('isr')) || 0,
            imgOpt: parseFloat(params.get('imgOpt')) || 0,
            storage: parseFloat(params.get('storage')) || 0,
            privLink: parseFloat(params.get('privLink')) || 0
        };
    }
    return null;
}

function saveToStorage(values) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function loadPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    aiNumber.value = preset.ai;
    computeNumber.value = preset.compute;
    reqNumber.value = preset.req;
    bwNumber.value = preset.bw;
    formNumber.value = preset.form;
    deployNumber.value = preset.deploy;
    fnInvocNumber.value = preset.fnInvoc || 0;
    isrNumber.value = preset.isr || 0;
    imgOptNumber.value = preset.imgOpt || 0;
    storageNumber.value = preset.storage || 0;
    privLinkNumber.value = preset.privLink || 0;
    updateAll();
}

function calculateVercelCost(inputs) {
    const { bandwidth, compute, req, ai, fnInvoc, isr, imgOpt, storage } = inputs;
    const plans = CONFIG_VERCEL.plans;
    const rates = CONFIG_VERCEL.overageRates;

    let cost = 0;
    let plan = 'Hobby';

    // Determine plan based on usage - start with hobby
    const proRequired = bandwidth > 1024 || compute > 40 || req > 10;
    if (proRequired) {
        plan = 'Pro';
        cost = plans.pro.monthlyCost;
    } else {
        plan = 'Hobby';
        cost = plans.hobby.monthlyCost;
    }

    // Calculate overage costs beyond plan limits
    const planLimits = proRequired ? plans.pro : plans.hobby;

    // Bandwidth overage
    if (bandwidth > planLimits.includedBandwidthGB) {
        const overageBw = bandwidth - planLimits.includedBandwidthGB;
        cost += overageBw * rates.bandwidth.costPerGB;
    }

    // Edge requests overage (in millions)
    const reqMillion = req / 1000000;
    if (reqMillion > planLimits.includedEdgeRequestsMillion) {
        const overageReq = reqMillion - planLimits.includedEdgeRequestsMillion;
        cost += overageReq * rates.edgeRequests.costPerMillion;
    }

    // Function invocations overage
    if (fnInvoc > 0) {
        cost += fnInvoc * rates.functionInvocations.costPerMillion;
    }

    // ISR operations overage (10k blocks)
    if (isr > 0) {
        cost += (isr / 10000) * rates.isrOperations.costPer10k;
    }

    // Image optimization
    if (imgOpt > 0) {
        cost += (imgOpt / 1000) * rates.imageOptimization.costPer1000;
    }

    // Storage
    if (storage > 0) {
        cost += storage * rates.storage.costPerGBMonth;
    }

    return {
        plan: plan,
        monthlyCost: Math.round(cost * 100) / 100,
        breakdown: `Usage: ${bandwidth.toFixed(1)}GB BW, ${compute.toFixed(1)}GB-h compute`
    };
}

function calculateRenderCost(inputs) {
    const { bandwidth, compute, privLink } = inputs;
    const plans = CONFIG_RENDER.plans;
    const rates = CONFIG_RENDER.overageRates;

    let cost = 0;
    let plan = 'Free';

    // Determine plan - free has no bandwidth, starter has 100GB included
    if (bandwidth > 0 || compute > 0 || privLink > 0) {
        plan = 'Starter';
        cost = plans.starter.monthlyCost;

        // Bandwidth overage beyond 100GB included
        if (bandwidth > plans.starter.includedBandwidthGB) {
            const overageBw = bandwidth - plans.starter.includedBandwidthGB;
            cost += (overageBw / 100) * rates.bandwidth.costPer100GB;
        }

        // Compute overage
        if (compute > 0) {
            cost += compute * rates.compute.costPerHour;
        }

        // Private link traffic overage
        if (privLink > 0) {
            cost += (privLink / 100) * rates.privateLinkTraffic.costPer100GB;
        }
    }

    return {
        plan: plan,
        monthlyCost: Math.round(cost * 100) / 100,
        breakdown: `Usage: ${bandwidth.toFixed(1)}GB BW, ${compute.toFixed(1)}GB-h compute`
    };
}

function calculateCost(totalCredits) {
    let cost = 0;
    let plan = '';
    let details = '';
    let tierKey = 'free';
    let progressInTier = 0;
    let tierMax = 0;
    let nextTierThreshold = 0;
    let nextTierName = '';
    let nextTierCost = 0;

    // Use config tiers or fallback to defaults
    const tiers = PRICING_TIERS.length > 0 ? PRICING_TIERS : [
        { name: 'Free', creditMax: 300, monthlyCost: 0, description: '300 credits included' },
        { name: 'Personal', creditMax: 1000, monthlyCost: 9, description: '1,000 credits/month' },
        { name: 'Pro', creditMax: 3000, monthlyCost: 20, description: '3,000 credits/month' }
    ];

    const overageConfig = OVERAGE_CONFIG.creditsPerPack ? OVERAGE_CONFIG : {
        basePlanCost: 20,
        creditsPerPack: 1500,
        costPerPack: 10
    };

    // Find applicable tier
    let applicableTier = tiers[0];
    let tierIndex = 0;
    for (let i = 0; i < tiers.length; i++) {
        if (totalCredits <= tiers[i].creditMax) {
            applicableTier = tiers[i];
            tierIndex = i;
            break;
        }
    }

    cost = applicableTier.monthlyCost;
    plan = applicableTier.name;
    details = applicableTier.description;
    tierKey = applicableTier.name.toLowerCase().replace(/\s+/g, '-');

    // Calculate progress within current tier
    const tierMin = tierIndex === 0 ? 0 : tiers[tierIndex - 1].creditMax;
    tierMax = applicableTier.creditMax;
    progressInTier = totalCredits - tierMin;
    const tierRange = tierMax - tierMin;

    // Get next tier info
    if (tierIndex < tiers.length - 1) {
        const nextTier = tiers[tierIndex + 1];
        nextTierThreshold = nextTier.creditMax;
        nextTierName = nextTier.name;
        nextTierCost = nextTier.monthlyCost;
    }

    // Handle overage
    const maxCreditInTiers = tiers[tiers.length - 1].creditMax;
    if (totalCredits > maxCreditInTiers) {
        const overage = totalCredits - maxCreditInTiers;
        const extraPacks = Math.ceil(overage / overageConfig.creditsPerPack);
        const extraCost = extraPacks * overageConfig.costPerPack;
        cost = overageConfig.basePlanCost + extraCost;
        plan = plan + ' + Extra';
        details = `${maxCreditInTiers.toLocaleString()} credits + ${extraPacks} extra pack${extraPacks > 1 ? 's' : ''} (${extraPacks * overageConfig.creditsPerPack} extra credits)`;
        tierKey = 'extra';
        tierMax = totalCredits + (overageConfig.creditsPerPack - (overage % overageConfig.creditsPerPack));
        progressInTier = overage % overageConfig.creditsPerPack || overageConfig.creditsPerPack;
    }

    return {
        cost,
        plan,
        details,
        tierKey,
        progressInTier,
        tierMax,
        nextTierThreshold,
        nextTierName,
        nextTierCost,
        tierMin
    };
}

function updateRangeBackground(rangeEl) {
    if (!rangeEl) return;
    const value = (rangeEl.value - rangeEl.min) / (rangeEl.max - rangeEl.min) * 100;
    rangeEl.style.background = `linear-gradient(to right, #2e3f99 0%, #2e3f99 ${value}%, #e0e0ea ${value}%, #e0e0ea 100%)`;
}

function syncInputs(rangeEl, numberEl, value) {
    if (rangeEl && numberEl) {
        rangeEl.value = value;
        numberEl.value = value;
        updateRangeBackground(rangeEl);
    }
}

function updateAll() {
    // read current values - existing inputs
    const aiVal = parseFloat(aiNumber.value) || 0;
    const computeVal = parseFloat(computeNumber.value) || 0;
    const reqVal = parseFloat(reqNumber.value) || 0;
    const bwVal = parseFloat(bwNumber.value) || 0;
    const formVal = parseFloat(formNumber.value) || 0;
    const deployVal = parseFloat(deployNumber.value) || 0;

    // read current values - provider-specific inputs
    const fnInvocVal = parseFloat(fnInvocNumber.value) || 0;
    const isrVal = parseFloat(isrNumber.value) || 0;
    const imgOptVal = parseFloat(imgOptNumber.value) || 0;
    const storageVal = parseFloat(storageNumber.value) || 0;
    const privLinkVal = parseFloat(privLinkNumber.value) || 0;

    // calculate Netlify credits
    const aiCredits = aiVal * CREDITS_PER_AI_DOLLAR;
    const computeCredits = computeVal * CREDITS_PER_GBH;
    const reqCredits = reqVal * CREDITS_PER_10K_REQUESTS;
    const bwCredits = bwVal * CREDITS_PER_GB_BW;
    const formCredits = formVal * CREDITS_PER_FORM;
    const deployCredits = deployVal * CREDITS_PER_DEPLOY;

    // update Netlify credit hints
    aiCredSpan.textContent = Math.round(aiCredits * 10) / 10 + ' cr';
    computeCredSpan.textContent = Math.round(computeCredits * 10) / 10 + ' cr';
    reqCredSpan.textContent = Math.round(reqCredits * 10) / 10 + ' cr';
    bwCredSpan.textContent = Math.round(bwCredits * 10) / 10 + ' cr';
    formCredSpan.textContent = Math.round(formCredits * 10) / 10 + ' cr';
    deployCredSpan.textContent = Math.round(deployCredits * 10) / 10 + ' cr';

    // total Netlify credits
    const total = aiCredits + computeCredits + reqCredits + bwCredits + formCredits + deployCredits;
    totalSpan.textContent = total.toFixed(1);

    // fill bar width (relative to 3000 credits)
    const maxVisual = 3000;
    let percent = (total / maxVisual) * 100;
    percent = Math.min(percent, 100);
    fillBar.style.width = percent + '%';

    // bar color based on thresholds
    if (total <= 300) {
        fillBar.style.background = '#2e7d32'; // green - free
    } else if (total <= 1000) {
        fillBar.style.background = '#f5a623'; // orange - personal
    } else if (total <= 3000) {
        fillBar.style.background = '#d0021b'; // red - pro
    } else {
        fillBar.style.background = '#8b0000'; // dark red - overage
    }

    // calculate Netlify cost and plan
    const netlifyData = calculateCost(total);

    // display Netlify estimated cost in the bar section
    costSpan.textContent = '$' + netlifyData.cost;
    planHint.innerHTML = `${netlifyData.plan} · <strong>$${netlifyData.cost}/month</strong>`;

    // Update plan tag styling based on tier
    planHint.className = 'plan-tag tier-' + netlifyData.tierKey;

    // Update tier progress display
    const tierProgressDiv = document.getElementById('tierProgress');
    const tierFillBar = document.getElementById('tierFillBar');
    const progressText = document.getElementById('progressText');
    const tierCostRangeDiv = document.getElementById('tierCostRange');

    if (netlifyData.tierMax > netlifyData.tierMin && !netlifyData.plan.includes('Extra')) {
        tierProgressDiv.style.display = 'flex';
        const tierProgressPercent = Math.min((netlifyData.progressInTier / (netlifyData.tierMax - netlifyData.tierMin)) * 100, 100);
        tierFillBar.style.width = tierProgressPercent + '%';

        // Color the tier fill based on current tier
        if (total <= 300) {
            tierFillBar.style.background = '#2e7d32';
        } else if (total <= 1000) {
            tierFillBar.style.background = '#f5a623';
        } else if (total <= 3000) {
            tierFillBar.style.background = '#d0021b';
        }

        progressText.textContent = Math.round(netlifyData.progressInTier) + ' / ' + Math.round(netlifyData.tierMax - netlifyData.tierMin);
    } else {
        tierProgressDiv.style.display = 'none';
    }

    // Update cost range info
    let costRangeText = '';
    if (netlifyData.plan.includes('Extra')) {
        costRangeText = `Overage plan: <strong>$${netlifyData.cost}/month</strong> for ${Math.round(total)} credits (at ${Math.round((total - 3000) / (netlifyData.nextTierCost || 10))} packs)`;
    } else if (netlifyData.nextTierThreshold) {
        const creditsUntilNext = netlifyData.nextTierThreshold - total;
        costRangeText = `${netlifyData.details} · Next tier (${netlifyData.nextTierName}) at <strong>${netlifyData.nextTierThreshold}</strong> credits (+${Math.round(creditsUntilNext)} to jump)`;
    } else {
        costRangeText = netlifyData.details;
    }
    tierCostRangeDiv.innerHTML = costRangeText;

    // Calculate Vercel cost
    const vercelData = calculateVercelCost({
        bandwidth: bwVal,
        compute: computeVal,
        req: reqVal * 10000,
        ai: aiVal,
        fnInvoc: fnInvocVal,
        isr: isrVal,
        imgOpt: imgOptVal,
        storage: storageVal
    });

    // Calculate Render cost
    const renderData = calculateRenderCost({
        bandwidth: bwVal,
        compute: computeVal,
        privLink: privLinkVal
    });

    // Update provider result columns
    netlifyCreditsSpan.textContent = Math.round(total * 10) / 10 + ' credits';
    netlifyPlanSpan.textContent = netlifyData.plan;
    netlifyMonthlyCostSpan.textContent = '$' + netlifyData.cost + '/mo';

    vercelCreditsSpan.textContent = '-';
    vercelPlanSpan.textContent = vercelData.plan;
    vercelMonthlyCostSpan.textContent = '$' + vercelData.monthlyCost + '/mo';

    renderCreditsSpan.textContent = '-';
    renderPlanSpan.textContent = renderData.plan;
    renderMonthlyCostSpan.textContent = '$' + renderData.monthlyCost + '/mo';

    // sync sliders and update backgrounds
    syncInputs(aiRange, aiNumber, aiVal);
    syncInputs(computeRange, computeNumber, computeVal);
    syncInputs(reqRange, reqNumber, reqVal);
    syncInputs(bwRange, bwNumber, bwVal);
    syncInputs(formRange, formNumber, formVal);
    syncInputs(deployRange, deployNumber, deployVal);
    syncInputs(fnInvocRange, fnInvocNumber, fnInvocVal);
    syncInputs(isrRange, isrNumber, isrVal);
    syncInputs(imgOptRange, imgOptNumber, imgOptVal);
    syncInputs(storageRange, storageNumber, storageVal);
    syncInputs(privLinkRange, privLinkNumber, privLinkVal);

    updateRangeBackground(aiRange);
    updateRangeBackground(computeRange);
    updateRangeBackground(reqRange);
    updateRangeBackground(bwRange);
    updateRangeBackground(formRange);
    updateRangeBackground(deployRange);
    updateRangeBackground(fnInvocRange);
    updateRangeBackground(isrRange);
    updateRangeBackground(imgOptRange);
    updateRangeBackground(storageRange);
    updateRangeBackground(privLinkRange);

    // save to URL and storage
    const values = {
        ai: aiVal,
        compute: computeVal,
        req: reqVal,
        bw: bwVal,
        form: formVal,
        deploy: deployVal,
        fnInvoc: fnInvocVal,
        isr: isrVal,
        imgOpt: imgOptVal,
        storage: storageVal,
        privLink: privLinkVal
    };
    saveToURL(values);
    saveToStorage(values);
}

function bindPair(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;
    rangeEl.addEventListener('input', function() {
        numberEl.value = rangeEl.value;
        updateAll();
    });
    numberEl.addEventListener('input', function() {
        let val = parseFloat(numberEl.value);
        const min = parseFloat(numberEl.min);
        const max = parseFloat(numberEl.max);
        if (isNaN(val)) val = min;
        if (val < min) val = min;
        if (val > max) val = max;
        numberEl.value = val;
        rangeEl.value = val;
        updateAll();
    });
}

bindPair(aiRange, aiNumber);
bindPair(computeRange, computeNumber);
bindPair(reqRange, reqNumber);
bindPair(bwRange, bwNumber);
bindPair(formRange, formNumber);
bindPair(deployRange, deployNumber);
bindPair(fnInvocRange, fnInvocNumber);
bindPair(isrRange, isrNumber);
bindPair(imgOptRange, imgOptNumber);
bindPair(storageRange, storageNumber);
bindPair(privLinkRange, privLinkNumber);

// blur clamping
[aiNumber, computeNumber, reqNumber, bwNumber, formNumber, deployNumber, fnInvocNumber, isrNumber, imgOptNumber, storageNumber, privLinkNumber].forEach(inp => {
    inp.addEventListener('blur', function() {
        let val = parseFloat(this.value);
        const min = parseFloat(this.min);
        const max = parseFloat(this.max);
        if (isNaN(val)) val = min;
        if (val < min) val = min;
        if (val > max) val = max;
        this.value = val;

        if (this === aiNumber) aiRange.value = val;
        else if (this === computeNumber) computeRange.value = val;
        else if (this === reqNumber) reqRange.value = val;
        else if (this === bwNumber) bwRange.value = val;
        else if (this === formNumber) formRange.value = val;
        else if (this === deployNumber) deployRange.value = val;
        else if (this === fnInvocNumber) fnInvocRange.value = val;
        else if (this === isrNumber) isrRange.value = val;
        else if (this === imgOptNumber) imgOptRange.value = val;
        else if (this === storageNumber) storageRange.value = val;
        else if (this === privLinkNumber) privLinkRange.value = val;
        updateAll();
    });
});

// ----- initialization with URL and storage priority -----
async function initialize() {
    // Load config asynchronously in background (defaults already match config values)
    loadConfig();

    let initialValues = loadFromURL() || loadFromStorage();
    if (initialValues) {
        aiNumber.value = initialValues.ai;
        computeNumber.value = initialValues.compute;
        reqNumber.value = initialValues.req;
        bwNumber.value = initialValues.bw;
        formNumber.value = initialValues.form;
        deployNumber.value = initialValues.deploy;
        fnInvocNumber.value = initialValues.fnInvoc || 0;
        isrNumber.value = initialValues.isr || 0;
        imgOptNumber.value = initialValues.imgOpt || 0;
        storageNumber.value = initialValues.storage || 0;
        privLinkNumber.value = initialValues.privLink || 0;
    }

    updateAll();
}

initialize();

// ----- Sticky provider carousel handler -----
const providerCarousel = document.getElementById('providerCarousel');
const card = document.querySelector('.card');

function handleProviderCarouselSticky() {
    if (!providerCarousel || !card) return;

    const carouselRect = providerCarousel.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const isCurrentlyFixed = providerCarousel.classList.contains('is-fixed');

    // Check if carousel should be fixed (scrolled within navbar height)
    // Use 56px threshold (navbar height) to create hysteresis and prevent jitter
    const shouldBeFixed = carouselRect.top <= 56 && cardRect.top < 0;

    if (shouldBeFixed && !isCurrentlyFixed) {
        providerCarousel.classList.add('is-fixed');
    } else if (!shouldBeFixed && isCurrentlyFixed) {
        providerCarousel.classList.remove('is-fixed');
    }
}

// Listen to scroll events with throttling for performance
let scrollTimeout;
window.addEventListener('scroll', function() {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
        handleProviderCarouselSticky();
        scrollTimeout = null;
    }, 10);
}, { passive: true });

// Initial check
handleProviderCarouselSticky();
