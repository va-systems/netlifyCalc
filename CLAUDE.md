# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Netlify Credit Calculator** - A static web application that helps users estimate monthly Netlify billing costs based on resource usage. No build tools, frameworks, or external dependencies required.

**Live reference:** https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/

## Running the Application

Since this is a static HTML/CSS/JS project, no build step is needed:

```bash
# Option 1: Use Python's built-in server (Python 3.x)
python3 -m http.server 8000

# Option 2: Use Node.js
npx http-server

# Option 3: Use any static file server (Live Server, etc.)
# Then visit: http://localhost:8000 (or appropriate port)
```

## Architecture

### Core Concept

The calculator has six metered Netlify features with corresponding credit costs:

1. **AI Inference** - USD spend (180 credits per $1)
2. **Compute** - GB-hours (5 credits per GB-h)
3. **Web Requests** - Count per 10k (3 credits per 10k)
4. **Bandwidth** - Gigabytes (10 credits per GB)
5. **Form Submissions** - Count (1 credit per submission)
6. **Production Deploys** - Count (15 credits per deploy)

### Data Flow

1. **Input Layer** (`index.html`): Each feature has paired `<input type="range">` and `<input type="number">` elements
2. **Calculation** (`script.js:updateAll()` at ~line 167):
   - Reads current input values
   - Multiplies by conversion constants (defined at top of script.js)
   - Updates per-feature credit display
   - Computes total credits and estimated monthly cost
3. **Visualization**:
   - Progress bar (`#fillBar`) shows usage relative to 3000 credits
   - Color changes based on tier: green (free) → orange (personal) → red (pro) → dark red (overage)
   - Threshold markers at 300, 1k, 3k credits
4. **Persistence** (`script.js:saveToURL()` and `saveToStorage()`):
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

### Key Functions

- **`updateAll()`** (~line 167): Master update function - calculates credits, updates UI, saves state
- **`syncInputs()`** (~line 160): Keeps range and number inputs in sync
- **`bindPair()`** (~line 243): Attaches event listeners to range/number input pairs
- **`calculateCost()`** (~line 129): Determines plan tier and monthly cost
- **`loadPreset()`** (~line 117): Loads preset scenarios (blog, SaaS small, SaaS large)
- **`saveToURL()` / `loadFromURL()`** (~line 75): Share-friendly URL state encoding
- **`saveToStorage()` / `loadFromStorage()`** (~line 101): Browser persistence via localStorage

## File Structure

- `index.html` - Semantic HTML, preset buttons, input rows, progress bar with threshold markers
- `script.js` - Core calculator logic, state management, input synchronization
- `style.css` - Component styling (card, inputs, progress bar, responsive layout)
- `test2.html` - Archive/reference file (not used in current build)

## Development Notes

- **No external dependencies** - Pure HTML/CSS/JavaScript
- **Responsive design** - Works on desktop and mobile (max-width: 700px)
- **Accessibility** - Uses `aria-label`, `aria-live`, semantic HTML (`<main>`)
- **Input range**: Sliders scaled to full Pro allotment (3000 credits max) for realistic comparisons
- **State sharing**: Both URL params and localStorage ensure state persists across sessions and can be shared via URL
- **Color feedback**: Progress bar color provides instant visual feedback on plan tier
- **No emojis** - Code and documentation must not use emoji characters

## Modifying Conversion Rates or Pricing

If Netlify's pricing changes, update these sections:

1. **Conversion constants** (`script.js`, lines 1-7) - Credit multipliers per feature
2. **Tier boundaries** (`calculateCost()` function, lines 135-155) - Credit thresholds and costs
3. **Slider max values** (`index.html`, input ranges) - Adjust if typical usage patterns change

## Testing

Since there's no test framework, manual testing covers:
- Range and number inputs stay in sync when either is modified
- Total credits calculation matches manual math
- Progress bar width and color reflect current tier
- URL parameters preserve state when shared
- localStorage persists after page reload
- Preset buttons load correct values
- Input blur clamping keeps values within min/max bounds
