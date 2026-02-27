# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Netlify Credit Calculator** - A web application that helps users estimate monthly Netlify billing costs based on resource usage. Built with Flask and Jinja2 for maintainability, with Frozen-Flask for static deployment.

**Live reference:** https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/

## Running the Application

### Flask Development Server (Recommended)

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python run.py

# Then visit: http://localhost:3000
```

### Generate Static Deployment

```bash
# Create production-ready static files in build/
python freeze.py

# Serve frozen build
cd build && python -m http.server 8000
# Then visit: http://localhost:8000
```

### Static Server Only (Original Method)

```bash
# Use Python's built-in server
python -m http.server 8000

# Or use Node.js
npx http-server

# Then visit: http://localhost:8000
```

## Architecture

### Flask Application Structure

```
app.py              - Flask application factory with route registration
config.py           - Development/production configuration
run.py              - Development server launcher
freeze.py           - Frozen-Flask static generator
templates/
  base.html         - Jinja2 base template (meta tags, CDN imports, layout)
  index.html        - Calculator page (extends base.html)
static/
  css/style.css     - Responsive styling
  js/script.js      - Calculator logic and state management
build/              - Frozen-Flask output (production-ready static files)
```

### Core Concept

The calculator has six metered Netlify features with corresponding credit costs:

1. **AI Inference** - USD spend (180 credits per $1)
2. **Compute** - GB-hours (5 credits per GB-h)
3. **Web Requests** - Count per 10k (3 credits per 10k)
4. **Bandwidth** - Gigabytes (10 credits per GB)
5. **Form Submissions** - Count (1 credit per submission)
6. **Production Deploys** - Count (15 credits per deploy)

### Data Flow

1. **Template Layer** (`templates/base.html`, `templates/index.html`): Jinja2 rendering with url_for() for static assets
2. **Input Layer** (`templates/index.html`): Each feature has paired `<input type="range">` and `<input type="number">` elements
3. **Calculation** (`static/js/script.js:updateAll()` at ~line 167):
   - Reads current input values
   - Multiplies by conversion constants (defined at top of script.js)
   - Updates per-feature credit display
   - Computes total credits and estimated monthly cost
4. **Visualization**:
   - Progress bar (`#fillBar`) shows usage relative to 3000 credits
   - Color changes based on tier: green (free) → orange (personal) → red (pro) → dark red (overage)
   - Threshold markers at 300, 1k, 3k credits
5. **Persistence** (`static/js/script.js:saveToURL()` and `saveToStorage()`):
   - URL parameters allow sharing calculator states
   - localStorage provides browser persistence

### Pricing Tiers

```javascript
Free:     0-300 credits    → $0/month
Personal: 301-1000 credits  → $9/month
Pro:      1001-3000 credits → $20/month
Extra:    3000+ credits     → $20 base + $10 per 1500 credit pack
```

See `calculateCost()` function (~line 129) for tier logic.

### Key JavaScript Functions

All in `static/js/script.js`:

- **`updateAll()`** (~line 167): Master update function - calculates credits, updates UI, saves state
- **`syncInputs()`** (~line 160): Keeps range and number inputs in sync
- **`bindPair()`** (~line 243): Attaches event listeners to range/number input pairs
- **`calculateCost()`** (~line 129): Determines plan tier and monthly cost
- **`loadPreset()`** (~line 117): Loads preset scenarios (blog, SaaS small, SaaS large)
- **`saveToURL()` / `loadFromURL()`** (~line 75): Share-friendly URL state encoding
- **`saveToStorage()` / `loadFromStorage()`** (~line 101): Browser persistence via localStorage

### Flask Routes

- **`/` (index)**: Renders calculator page using Jinja2 templating

## File Structure

**Flask Application:**
- `app.py` - Flask factory, route registration
- `config.py` - Environment configuration
- `run.py` - Development server entry point
- `freeze.py` - Static generation script
- `requirements.txt` - Python dependencies
- `templates/base.html` - Base Jinja2 template with meta tags, CDN links, static asset imports
- `templates/index.html` - Calculator markup (extends base.html)
- `static/css/style.css` - Component styling (card, inputs, progress bar, responsive layout)
- `static/js/script.js` - Core calculator logic, state management, input synchronization
- `build/` - Frozen-Flask generated output (production-ready static HTML)

**Static Files (Original):**
- `index.html` - Original static HTML (kept for reference)
- `script.js` - Original script (kept for reference)
- `style.css` - Original styles (kept for reference)

## Development Notes

- **Flask Framework** - Uses Jinja2 templating for maintainable HTML structure
- **Frozen-Flask** - Generates production-ready static HTML/CSS/JS for any static host
- **No external backend dependencies** - Frontend remains pure HTML/CSS/JavaScript
- **Responsive design** - Works on desktop and mobile (max-width: 700px)
- **Accessibility** - Uses `aria-label`, `aria-live`, semantic HTML (`<main>`)
- **Input range**: Sliders scaled to full Pro allotment (3000 credits max) for realistic comparisons
- **State sharing**: Both URL params and localStorage ensure state persists across sessions and can be shared via URL
- **Color feedback**: Progress bar color provides instant visual feedback on plan tier
- **No emojis** - Code and documentation must not use emoji characters
- **Template inheritance** - Uses base.html to avoid duplication of meta tags, CDN imports, and script tags

## Modifying Conversion Rates or Pricing

If Netlify's pricing changes, update these sections in the source files:

1. **Conversion constants** (`static/js/script.js`, lines 1-7) - Credit multipliers per feature
2. **Tier boundaries** (`calculateCost()` function, `static/js/script.js` lines 135-155) - Credit thresholds and costs
3. **Slider max values** (`templates/index.html`, input ranges) - Adjust if typical usage patterns change

After changes, regenerate static files with:
```bash
python freeze.py
```

## Testing

Since there's no test framework, manual testing covers:
- Range and number inputs stay in sync when either is modified
- Total credits calculation matches manual math
- Progress bar width and color reflect current tier
- URL parameters preserve state when shared
- localStorage persists after page reload
- Preset buttons load correct values
- Input blur clamping keeps values within min/max bounds
