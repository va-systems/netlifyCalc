# Delta Study: Multi-Provider Calculator Variables

## Overview

Analysis of variables needed to create a unified input form that calculates usage and costs across Netlify, Vercel, and Render service providers.

---

## Shared/Common Variables (All Three Providers)

```javascript
{
  "commonMetrics": {
    "bandwidth": {
      "value": "number",
      "unit": "GB",
      "tracked": ["Netlify", "Vercel", "Render"]
    },
    "compute": {
      "value": "number",
      "unit": "GB-hour or CPU-hour",
      "tracked": ["Netlify", "Vercel", "Render"]
    },
    "requests": {
      "value": "number",
      "unit": "count or per-million",
      "tracked": ["Netlify (per 10k)", "Vercel (per million)"]
    }
  }
}
```

---

## Provider-Specific Variables

### Netlify Unique
```javascript
"netlifyMetrics": {
  "aiInference": "USD (converts to 180 credits/$1)",
  "formSubmissions": "count",
  "productionDeploys": "count"
}
```

### Vercel Unique
```javascript
"vercelMetrics": {
  "aiGateway": "USD spent",
  "functionInvocations": "count",
  "isrReadsWrites": "count",
  "imageOptimization": "requests",
  "storage": "GB"
}
```

### Render Unique
```javascript
"renderMetrics": {
  "privateLinkTraffic": "GB",
  "websocketResponses": "count"
}
```

---

## Unified Config Structure

Extended format based on existing `config.json`:

```json
{
  "providers": {
    "netlify": {
      "conversionRates": {
        "bandwidth": { "creditsPerUnit": 10, "unit": "GB" },
        "compute": { "creditsPerUnit": 5, "unit": "GB-hour" },
        "requests": { "creditsPerUnit": 3, "unit": "10,000 requests" },
        "aiInference": { "creditsPerUnit": 180, "unit": "USD" },
        "forms": { "creditsPerUnit": 1, "unit": "submission" },
        "deploys": { "creditsPerUnit": 15, "unit": "deploy" }
      },
      "pricingTiers": [
        { "name": "Free", "creditMax": 300, "cost": 0 },
        { "name": "Personal", "creditMax": 1000, "cost": 9 },
        { "name": "Pro", "creditMax": 3000, "cost": 20 }
      ],
      "overageRate": { "creditsPerPack": 1500, "costPerPack": 10 }
    },
    "vercel": {
      "conversionRates": {
        "bandwidth": { "costPerGB": 0.15, "unit": "GB" },
        "computeCPU": { "costPerHour": "varies", "unit": "CPU-hour" },
        "edgeRequests": { "costPerMillion": 2, "unit": "1 million requests" },
        "functionInvocations": "included",
        "isrReads": { "costPer10k": "varies" },
        "isrWrites": { "costPer10k": "varies" },
        "imageOptimization": "included",
        "storage": { "costPerGB": "varies" }
      },
      "basePlans": [
        { "name": "Hobby", "monthlyCost": 0, "included": { "bandwidth": "100GB", "computeHours": "4" } },
        { "name": "Pro", "monthlyCost": 20, "included": { "bandwidth": "1TB", "computeHours": "40" } }
      ]
    },
    "render": {
      "conversionRates": {
        "bandwidth": { "costPer100GB": 15, "unit": "GB" },
        "compute": { "costPerHour": "0.0695", "unit": "CPU-hour" },
        "privateLinkTraffic": { "costPer100GB": "lower rate", "unit": "GB" }
      },
      "basePlans": [
        { "name": "Free", "monthlyCost": 0 },
        { "name": "Starter", "monthlyCost": 7 }
      ]
    }
  }
}
```

---

## Form Input Variables

```javascript
const unifiedFormInputs = {
  // Common (all three providers)
  "bandwidth_gb": 0,
  "compute_gb_hours": 0,
  "web_requests_count": 0,

  // Netlify-specific
  "ai_inference_usd": 0,
  "form_submissions": 0,
  "production_deploys": 0,

  // Vercel-specific
  "vercel_ai_gateway_usd": 0,
  "function_invocations": 0,
  "isr_operations": 0,
  "image_optimization_requests": 0,
  "storage_gb": 0,

  // Render-specific
  "private_link_traffic_gb": 0
}
```

---

## Calculation Logic Structure

```javascript
{
  "calculateCosts": {
    "netlify": function(inputs) {
      // Sum all metrics into credits, apply tiers
      return { monthlyCost, credits, tier }
    },
    "vercel": function(inputs) {
      // Calculate individual charges per metric
      return { monthlyCost, breakdown }
    },
    "render": function(inputs) {
      // Calculate compute + bandwidth costs
      return { monthlyCost, breakdown }
    }
  }
}
```

---

## Key Differences

| Aspect | Netlify | Vercel | Render |
|--------|---------|--------|--------|
| **Pricing Model** | Unified credits + tiers | Usage-based per metric | Base plan + overages |
| **Minimum Cost** | $0 (Free tier) | $0 (Hobby) | $7 (Starter) |
| **Calculation Method** | Convert all to credits → tier cost | Sum individual metrics | Base + variable |
| **Overages** | Packs of 1500 credits | Per-unit pricing | Prorated hourly |

---

## Critical Implementation Challenges

1. **Unit Normalization**: Requests tracked differently
   - Netlify: per 10,000
   - Vercel: per million
   - Render: not separately tracked

2. **Pricing Model Mismatch**:
   - Netlify uses pooled credit system
   - Vercel and Render itemize costs
   - Need separate calculation flows

3. **Partial Inputs**: Form should handle scenarios where user only wants to calculate for one provider

4. **Provider-Specific Fields**: UI must conditionally show/hide fields based on selected provider(s)

---

## Metric Coverage Matrix

| Metric | Netlify | Vercel | Render |
|--------|---------|--------|--------|
| Bandwidth | ✅ | ✅ | ✅ |
| Compute/CPU | ✅ | ✅ | ✅ |
| Web Requests | ✅ | ✅ | ❌ |
| AI Inference | ✅ | ✅ | ❌ |
| Function Invocations | Included in Compute | ✅ | Included in Compute |
| ISR Reads/Writes | ❌ | ✅ | ❌ |
| Image Optimization | ❌ | ✅ | ❌ |
| Storage | ❌ | ✅ | ❌ |
| Form Submissions | ✅ | ❌ | ❌ |
| Production Deploys | ✅ | ❌ | ❌ |
| Private Link Traffic | ❌ | ❌ | ✅ |

---

---

## Recommended UI Pattern: Hybrid Approach (Option 1 + 4)

Combines the best of both worlds for user experience and information density.

### Implementation Strategy

**Small Provider Badges (Option 1)**
- Placed immediately after each input field
- Shows quick visual reference of which providers are affected
- Uses SVG icons or initials (N, V, R)
- Compact, non-intrusive design
- Hover shows tooltip with provider name

**Expandable Coverage Matrix (Option 4)**
- `<details>` element with "Provider Coverage Guide" summary
- Positioned below all inputs or in a dedicated help section
- Full matrix showing all input-to-provider relationships
- Serves as reference documentation
- Can be kept closed by default to reduce visual clutter

### Code Structure

```html
<!-- Per-input badges -->
<div class="input-group">
  <label>Bandwidth (GB)</label>
  <input type="range" class="bandwidth-input">
  <div class="provider-badges">
    <span class="badge" data-provider="netlify" title="Affects Netlify">N</span>
    <span class="badge" data-provider="vercel" title="Affects Vercel">V</span>
    <span class="badge" data-provider="render" title="Affects Render">R</span>
  </div>
</div>

<!-- Global matrix (collapsible) -->
<details class="provider-coverage-matrix">
  <summary>Provider Coverage Guide</summary>
  <table>
    <thead>
      <tr>
        <th>Input</th>
        <th>Netlify</th>
        <th>Vercel</th>
        <th>Render</th>
      </tr>
    </thead>
    <tbody>
      <!-- Full matrix rows -->
    </tbody>
  </table>
</details>
```

### Visual Design Considerations

- **Badge colors**: Match provider brand colors or use neutral grays
- **Inactive badges**: Can be grayed out/transparent if input has no effect on that provider
- **Accessibility**: Include `title` attributes for tooltip support
- **Responsive**: Stack badges vertically on mobile if needed

### Benefits

1. **Badges** provide at-a-glance reference without overwhelming UI
2. **Matrix** offers comprehensive documentation for users wanting full details
3. **Together** they serve both quick-scan and research use cases
4. **Progressive disclosure** - details hidden by default, visible on demand
5. **No animation overhead** - static HTML/CSS, performant

---

## References

- [Netlify Credit-Based Pricing](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)
- [Vercel Pricing](https://vercel.com/pricing)
- [Render Pricing](https://render.com/pricing)
