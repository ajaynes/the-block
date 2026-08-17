# Vehicle Auction Marketplace

## How to Run

```
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). No environment variables, backend, or database setup required — vehicle data is read directly from `data/vehicles.json`, and all buyer-generated state (bids, watchlist, Buy Now purchases) is simulated client-side and persisted to `localStorage`.

`npm run build` produces a clean production build.

## Time Spent
### Total: ~5 hours (over the 4 hour suggested estimate)

- **Planning (~1 hour):** Prioritizing thorough planning upfront paid off by significantly streamlining development. Mapping out architecture and requirements early set a clear path forward.
- **Feature Development (~2 hours):** Implemented all core requirements alongside custom additions. To maximize efficiency within the timeframe, I integrated an image gallery library for the Product Details Page (PDP).
- **Styling (~1 hour):** Accelerated initial UI setup using Claude Code, then manually refined the styling and design details to match my vision.
- **User Feedback, QA, & Polishing (Remaining Time):** Dedicated the final portion of the project to usability testing, bug fixing, and fine-tuning.

## Assumptions and Scope

- Frontend-only, per the challenge's allowances — no auth, no backend, no payments/checkout, no seller/dealer tooling.
- Auction timestamps are normalized relative to "now" on load (preserving the dataset's original relative ordering) so the app always shows a realistic mix of upcoming/live/ended auctions, as the README explicitly permits.
- Bidding is fully simulated client-side: a reducer models bid history, mock competing bidders on a randomized 10–30s cadence, an anti-snipe extension, and a fixed $250 minimum increment. State persists per vehicle in `localStorage` so a refresh doesn't reset an in-progress auction.
- "Buy Now" is scoped to upcoming auctions only, rather than live ones — letting it coexist with active bidding raised UX questions (what happens to existing bids? do you outbid the buy-now price?) I didn't want to half-solve in the time box.
- Watchlist is a simple client-side toggle persisted to `localStorage`; no account or cross-device sync.

## Stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, CSS Modules (no UI framework, no Tailwind)
- **Backend:** none — one API route (`/api/vehicle-search`) powers search autocomplete over the bundled dataset
- **Database:** none — `data/vehicles.json` is the source of truth; buyer-generated state lives in `localStorage`

## What I Built

A buyer-facing vehicle auction marketplace:

- **Homepage** — filterable/searchable inventory grid (make, body style, title status, year, auction status), sortable (defaults to ending soonest), paginated, with autocomplete search in the header.
- **Vehicle detail page** — photo gallery, full specs table, condition report/grade, collapsible damage notes, seller/sales info, breadcrumbs, and a related-auctions rail.
- **Live bidding** — real-time countdown, simulated competing bidders, anti-snipe extension, bid history, winning/outbid/haven't-bid status, and a first-bid confirmation modal explaining that bids are binding.
- **Buy Now** — instant-purchase option on upcoming auctions that have a buy-now price.
- **Watchlist** — persistent save/star on any vehicle card.
- A branding pass matching OPENLANE's real site (fonts, colors, logo), a footer, a custom 404 page, and an accessibility/SEO pass (semantic headings, color contrast, keyboard-accessible photo gallery, page metadata).

## Notable Decisions

- Simulated a fully "live" auction experience client-side (mock bidders, anti-snipe) rather than a static bid form — a buyer's trust in an auction platform depends heavily on it feeling live and real, which felt like the highest-leverage place to spend extra time.
- Kept the bid-increment model simple (flat $250) after initially building a selectable $100/$500/$1,000 stepper — a fixed increment was more predictable and closer to how real auction platforms behave than a user-selectable step.
- Used generic "Bidder 1" / "Bidder 2" labels for simulated competing bids instead of realistic-looking usernames, so the app doesn't read as if it's exposing real people's activity.
- Treated accessibility and basic SEO (contrast, keyboard operability, page metadata) as part of "craft," not an afterthought — ran an explicit pass late in the build and fixed what came up.

## Testing

- Manual testing throughout in Chromium and WebKit (desktop + mobile viewports), plus real-device testing on iOS Safari over the local network.
- `npx tsc --noEmit` and `npm run build` kept clean throughout development.
- Verified keyboard accessibility (photo gallery, filters, bid form, modal) and text color contrast against WCAG AA.

## What I'd Do With More Time

- Automated tests — the bidding reducer in particular is pure logic that'd benefit from real unit tests rather than manual verification alone.
- Revisit whether Buy Now should also apply to live (not just upcoming) auctions, with more design time to work through the interaction.
- Build out the product surfaces the challenge explicitly scoped out (accounts, a real "My Bids" page) if this were headed toward production.

## AI Tool Usage

I used Claude and Claude Code throughout this build — for researching common UI/UX patterns for auctions and bidding, as a rubber ducky, some implementation, debugging, and SEO and Accessibility scanning.
