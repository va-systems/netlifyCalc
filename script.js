// ----- conversion rates loaded from config.json -----
let CONFIG = null;
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
const URL_PARAM_NAMES = ['ai', 'compute', 'req', 'bw', 'form', 'deploy'];

// ----- load configuration from config.json -----
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) throw new Error('Failed to load config');
        CONFIG = await response.json();

        // Update conversion rates from config
        CREDITS_PER_AI_DOLLAR = CONFIG.conversionRates.ai.creditsPerUnit;
        CREDITS_PER_GBH = CONFIG.conversionRates.compute.creditsPerUnit;
        CREDITS_PER_10K_REQUESTS = CONFIG.conversionRates.requests.creditsPerUnit;
        CREDITS_PER_GB_BW = CONFIG.conversionRates.bandwidth.creditsPerUnit;
        CREDITS_PER_FORM = CONFIG.conversionRates.forms.creditsPerUnit;
        CREDITS_PER_DEPLOY = CONFIG.conversionRates.deploys.creditsPerUnit;
        PRICING_TIERS = CONFIG.pricingTiers;
        OVERAGE_CONFIG = CONFIG.overageCost;
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
        deploy: 5
    },
    saas_small: {
        name: 'Simple SaaS (<1000 users)',
        ai: 8,
        compute: 25,
        req: 40,
        bw: 15,
        form: 200,
        deploy: 10
    },
    saas_large: {
        name: 'Major SaaS (100K users)',
        ai: 200,
        compute: 300,
        req: 5000,
        bw: 500,
        form: 50000,
        deploy: 50
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

// ----- URL and Storage Functions -----
function saveToURL(values) {
    const params = new URLSearchParams();
    params.set('ai', values.ai.toFixed(2));
    params.set('compute', values.compute.toFixed(1));
    params.set('req', values.req.toFixed(0));
    params.set('bw', values.bw.toFixed(1));
    params.set('form', values.form.toFixed(0));
    params.set('deploy', values.deploy.toFixed(0));
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
            deploy: parseFloat(params.get('deploy')) || 0
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
    updateAll();
}

function calculateCost(totalCredits) {
    let cost = 0;
    let plan = '';
    let details = '';

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
    for (let tier of tiers) {
        if (totalCredits <= tier.creditMax) {
            applicableTier = tier;
            break;
        }
    }

    cost = applicableTier.monthlyCost;
    plan = applicableTier.name;
    details = applicableTier.description;

    // Handle overage
    const maxCreditInTiers = tiers[tiers.length - 1].creditMax;
    if (totalCredits > maxCreditInTiers) {
        const overage = totalCredits - maxCreditInTiers;
        const extraPacks = Math.ceil(overage / overageConfig.creditsPerPack);
        const extraCost = extraPacks * overageConfig.costPerPack;
        cost = overageConfig.basePlanCost + extraCost;
        plan = plan + ' + Extra';
        details = `${maxCreditInTiers.toLocaleString()} credits + ${extraPacks} extra pack${extraPacks > 1 ? 's' : ''} (${extraPacks * overageConfig.creditsPerPack} extra credits)`;
    }

    return { cost, plan, details };
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
    // read current values
    const aiVal = parseFloat(aiNumber.value) || 0;
    const computeVal = parseFloat(computeNumber.value) || 0;
    const reqVal = parseFloat(reqNumber.value) || 0;
    const bwVal = parseFloat(bwNumber.value) || 0;
    const formVal = parseFloat(formNumber.value) || 0;
    const deployVal = parseFloat(deployNumber.value) || 0;

    // calculate credits
    const aiCredits = aiVal * CREDITS_PER_AI_DOLLAR;
    const computeCredits = computeVal * CREDITS_PER_GBH;
    const reqCredits = reqVal * CREDITS_PER_10K_REQUESTS;
    const bwCredits = bwVal * CREDITS_PER_GB_BW;
    const formCredits = formVal * CREDITS_PER_FORM;
    const deployCredits = deployVal * CREDITS_PER_DEPLOY;

    // update hints
    aiCredSpan.textContent = Math.round(aiCredits * 10) / 10 + ' cr';
    computeCredSpan.textContent = Math.round(computeCredits * 10) / 10 + ' cr';
    reqCredSpan.textContent = Math.round(reqCredits * 10) / 10 + ' cr';
    bwCredSpan.textContent = Math.round(bwCredits * 10) / 10 + ' cr';
    formCredSpan.textContent = Math.round(formCredits * 10) / 10 + ' cr';
    deployCredSpan.textContent = Math.round(deployCredits * 10) / 10 + ' cr';

    // total credits
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

    // calculate cost and plan
    const costData = calculateCost(total);

    // display estimated cost
    costSpan.textContent = '$' + costData.cost;

    // plan hint with cost
    planHint.innerHTML = `${costData.plan} · ${costData.details} · <strong>$${costData.cost}/month</strong>`;

    // sync sliders and update backgrounds
    syncInputs(aiRange, aiNumber, aiVal);
    syncInputs(computeRange, computeNumber, computeVal);
    syncInputs(reqRange, reqNumber, reqVal);
    syncInputs(bwRange, bwNumber, bwVal);
    syncInputs(formRange, formNumber, formVal);
    syncInputs(deployRange, deployNumber, deployVal);

    updateRangeBackground(aiRange);
    updateRangeBackground(computeRange);
    updateRangeBackground(reqRange);
    updateRangeBackground(bwRange);
    updateRangeBackground(formRange);
    updateRangeBackground(deployRange);

    // save to URL and storage
    const values = {
        ai: aiVal,
        compute: computeVal,
        req: reqVal,
        bw: bwVal,
        form: formVal,
        deploy: deployVal
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

// blur clamping
[aiNumber, computeNumber, reqNumber, bwNumber, formNumber, deployNumber].forEach(inp => {
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
        updateAll();
    });
});

// ----- initialization with URL and storage priority -----
async function initialize() {
    await loadConfig();

    let initialValues = loadFromURL() || loadFromStorage();
    if (initialValues) {
        aiNumber.value = initialValues.ai;
        computeNumber.value = initialValues.compute;
        reqNumber.value = initialValues.req;
        bwNumber.value = initialValues.bw;
        formNumber.value = initialValues.form;
        deployNumber.value = initialValues.deploy;
    }

    updateAll();
}

initialize();
