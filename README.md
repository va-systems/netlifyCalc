# Netlify Credit Calculator

A clean, interactive web calculator for estimating monthly Netlify billing costs based on resource usage. Built with vanilla HTML, CSS, and JavaScript—no frameworks or build tools required.

**Live Usage**: Simply run a local server and start calculating your estimated costs based on real Netlify pricing tiers.

## Features

- **Interactive Sliders & Input Fields**: Adjust usage values with range sliders or type precise numbers
- **Real-Time Cost Calculation**: Instant feedback on estimated monthly billing
- **Visual Tier Indicators**: Segmented progress bar shows which pricing tier you're in (Free, Personal, Pro, or Extra)
- **Preset Scenarios**: Quick-load templates for common use cases (Personal Blog, SaaS Small, SaaS Large)
- **State Persistence**: Save your inputs via browser localStorage or share configurations via URL parameters
- **Informative Tooltips**: Hover over feature labels to understand what each parameter measures
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Configuration-Driven**: Easily modify pricing without touching code
- **Provider Coverage Indicators**: Visual badges showing which service providers (Netlify, Vercel, Render) each metric affects
- **No External Dependencies**: Pure HTML, CSS, and JavaScript

## Getting Started

### Run with Flask (Recommended for Development)

The project now includes a Flask application with Jinja2 templating for better maintainability:

```bash
# Install dependencies
pip install -r requirements.txt

# Run Flask development server
python run.py

# Then visit: http://localhost:8080
```

You can customize the port with the `FLASK_PORT` environment variable:
```bash
FLASK_PORT=3000 python run.py
```

### Generate Static Files with Frozen-Flask

To create deployment-ready static files:

```bash
# Generate build/ directory with static HTML/CSS/JS
python freeze.py

# Serve the frozen build locally
cd build && python -m http.server 8000

# Then visit: http://localhost:8000
```

### Run Locally with Basic HTTP Server (Original Method)

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Then visit: http://localhost:8000
```

### Project Structure

**Flask Application:**
```
netlify-calc/
├── app.py                  # Flask application factory
├── config.py               # Configuration settings (dev/prod)
├── run.py                  # Development server launcher
├── freeze.py               # Frozen-Flask static generator
├── requirements.txt        # Python dependencies
├── templates/
│   ├── base.html          # Base Jinja2 template with meta/scripts
│   └── index.html         # Calculator page (extends base.html)
├── static/
│   ├── css/style.css      # Responsive styling
│   └── js/script.js       # Calculator logic & state management
├── build/                 # Generated static files (Frozen-Flask output)
└── README.md              # This file
```

**Static Files (for original method):**
```
netlify-calc/
├── index.html             # HTML structure & semantic markup
├── style.css              # Responsive styling & tooltip component
├── script.js              # Calculator logic & state management
└── README.md              # This file
```

## How It Works

### Core Calculation Flow

1. **Input Layer** (`index.html`): User adjusts values via range sliders or number inputs
2. **Configuration** (`config.json`): Loads conversion rates and pricing tiers
3. **Calculation** (`script.js`): Multiplies user values by conversion rates from config
4. **Output**: Displays total credits, estimated cost, and visual tier indicator
5. **Persistence**: Saves state to localStorage and URL parameters for sharing

### Metered Features

The calculator tracks six Netlify features:

| Feature | Unit | Credits | Tooltip |
|---------|------|---------|---------|
| **AI Inference** | USD | 180 per $1 | Costs for AI agents and models |
| **Compute** | GB-hour | 5 per GB-h | Serverless functions & background jobs |
| **Web Requests** | 10,000 | 3 per 10k | All HTTP requests including edge functions |
| **Bandwidth** | GB | 10 per GB | Data transferred to visitors globally |
| **Form Submissions** | Count | 1 per submit | Legitimate form submissions (spam filtered) |
| **Production Deploys** | Count | 15 per deploy | Publishing to production |

### Pricing Tiers

| Tier | Credits | Cost | Description |
|------|---------|------|-------------|
| **Free** | 0–300 | $0/mo | Included credits |
| **Personal** | 301–1,000 | $9/mo | 1,000 monthly credits |
| **Pro** | 1,001–3,000 | $20/mo | 3,000 monthly credits |
| **Extra** | 3,001+ | $20 + $10/pack | Additional 1,500-credit packs @ $10 each |

## Configuration

### Modifying Pricing or Conversion Rates

Edit `config.json` to quickly update any pricing parameter without touching JavaScript:

```json
{
  "conversionRates": {
    "ai": {
      "creditsPerUnit": 180,
      "unit": "USD",
      "description": "AI inference spend"
    },
    "compute": {
      "creditsPerUnit": 5,
      "unit": "GB-hour",
      "description": "Compute usage"
    }
    // ... other features
  },
  "pricingTiers": [
    {
      "name": "Free",
      "creditMax": 300,
      "monthlyCost": 0,
      "description": "300 credits included"
    }
    // ... other tiers
  ],
  "overageCost": {
    "basePlanCost": 20,
    "creditsPerPack": 1500,
    "costPerPack": 10,
    "description": "Additional packs beyond Pro tier"
  }
}
```

**Key Update Points:**
- `conversionRates[feature].creditsPerUnit` — Change credit multipliers
- `pricingTiers[].creditMax` — Adjust tier thresholds
- `pricingTiers[].monthlyCost` — Update tier pricing
- `overageCost` — Configure overage pack pricing

All changes are reflected immediately without code modifications.

## Component Architecture

### Reusable Tooltip Component

Tooltips are implemented as a self-contained, reusable CSS/HTML component:

**HTML Structure:**
```html
<span class="meter-label">
  <span class="label-text">Feature Name <small>(unit)</small></span>
  <span class="tooltip-container">
    <span class="tooltip-icon">i</span>
    <div class="tooltip-content">Explanation text</div>
  </span>
</span>
```

**CSS Classes:**
- `.tooltip-container` — Positioning context
- `.tooltip-icon` — Styled info badge with hover state
- `.tooltip-content` — Hidden by default, appears on hover with smooth animation

**Styling Details:**
- **Desktop**: 280px width, 1rem padding, 0.85rem font-size
- **Mobile**: 220px width, 0.875rem padding, 0.8rem font-size
- Arrow pointer with smooth shadows
- Accessible with `cursor: help` on icon

## Customization Guide

### Changing Fonts

Update CSS variables in `style.css`:

```css
:root {
  --font-display: 'Your Display Font', serif;
  --font-body: 'Your Body Font', sans-serif;
}
```

Currently using **Playfair Display** (display) and **Source Sans Pro** (body).

### Adjusting Colors

Modify the color palette in `:root`:

```css
:root {
  --color-accent: #2e3f99;        /* Primary interactive color */
  --color-text: #1a1a2e;          /* Text color */
  --color-muted: #6b6b7e;         /* Secondary text */
  --color-bg: #f4f4f7;            /* Background */
}
```

### Preset Scenarios

Edit preset values in `script.js`:

```javascript
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
  // Add or modify presets...
};
```

## Testing

Manual testing checklist:

- [ ] Range sliders update matching number inputs
- [ ] Number inputs update matching sliders
- [ ] Total credits calculation matches manual math
- [ ] Progress bar width and color reflect current tier
- [ ] Tooltips appear and disappear on hover
- [ ] URL parameters preserve state when shared
- [ ] localStorage persists after page reload
- [ ] Preset buttons load correct values
- [ ] Mobile layout is responsive and readable

## Browser Support

Works on all modern browsers supporting:
- CSS Grid & Flexbox
- CSS Custom Properties (variables)
- Fetch API (for loading config.json)
- ES6 async/await

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Semantic HTML structure with `<main>` role
- `aria-label` attributes on all inputs
- `aria-live="polite"` on dynamic output regions
- Sufficient color contrast ratios
- Keyboard-navigable range sliders
- Tooltips with `cursor: help` for discoverability

## Brand Assets & Attribution

Provider logos and icons (SVG/favicons) are sourced from public domain repositories:

- **Netlify**: [Brandfetch](https://brandfetch.com/netlify.com)
- **Vercel**: [Official Geist Design System](https://vercel.com/geist/brands)
- **Render**: [Brandfetch](https://brandfetch.com/render.com)

Detailed attributions will be added to the website footer upon implementation. These assets are used under their respective brand guidelines for informational and educational purposes.

## Notes

- **No external dependencies** — Uses native HTML/CSS/JS only
- **Configuration-driven** — Pricing changes don't require code edits
- **Responsive** — Works perfectly from mobile (320px) to desktop (1200px+)
- **Share-friendly** — URL encoding allows calculator states to be shared
- **Performant** — Smooth animations, zero layout thrashing

## Reference

- [Netlify Credit-Based Pricing](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)
- Not affiliated with Netlify

## License

Free to use and modify for personal or commercial purposes.
