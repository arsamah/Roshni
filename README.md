# Roshni Studios — React build

A like-for-like port of the hand-built `roshni-studios-v3.html` one-pager to
React + Vite + TypeScript + Tailwind, with React Router covering the three
case-study pages.

Nothing here is a redesign. The design system, the copy, the aurora technique
and the scroll maths are carried over deliberately and exactly — several of
them were tuned through multiple failed attempts, and the comments in the
source record which attempts failed and why.

---

## Running it

```powershell
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check, then bundle to dist/
npm run preview    # serve dist/ on http://localhost:4173
npm test           # Playwright suite, both builds
```

---

## The one idea to understand first

Scrolling down the page is a journey from **Oslo (59.91°N) to Dubai
(25.20°N)**. A single scroll-progress value `p` (0 → 1) drives four things at
once, so they can never fall out of sync:

| What | How |
|---|---|
| the latitude readout on the right rail | `59.91 − p × (59.91 − 25.20)` |
| the starfield fading out | `--north`, gone by 46% of scroll |
| the desert light arriving | `--warm`, starts at 60% of scroll |
| the sky gradient | `--sky-t` / `--sky-m` / `--sky-b`, interpolated |

All of it lives in **one hook**, `src/hooks/useJourneyScroll.ts`, called once
from `src/pages/Home.tsx`. The rail, the header state and the sky all read from
that single call rather than each wiring up their own scroll listener.

**If you change one of these, change the others to match, or the metaphor
breaks.** The atmosphere is narrative, not decoration.

---

## Project structure

```
src/
  main.tsx                    entry; imports the stylesheets in cascade order
  router.tsx                  /  ·  /work/:slug  ·  *
  RootLayout.tsx              things that must exist exactly once: the SVG
                              filter defs and the fixed sky
  hooks/
    useJourneyScroll.ts       THE scroll engine (+ useResetJourney)
    useReveal.ts              IntersectionObserver reveal-on-scroll
    useDocumentHead.ts        per-route title / description / OG / canonical
  components/
    AuroraFilters.tsx         the three SVG noise filters — render once
    AuroraBand.tsx            three curtains, nothing else
    Sky.tsx                   gradient · starfield · shimmer · horizon
    Intro.tsx                 2.1s splash
    LatitudeRail.tsx          the signature right-hand rail
    Header.tsx  Footer.tsx  Wordmark.tsx
    Hero.tsx  SectorMarquee.tsx  Services.tsx  About.tsx  Work.tsx  Contact.tsx
    Reveal.tsx                wrapper for the .rv → .rv.in transition
  pages/
    Home.tsx  CaseStudy.tsx  NotFound.tsx
  data/content.ts             all copy, in one place
  styles/
    tokens.css                the design tokens
    base.css                  reset, type, buttons, focus, reduced motion
    sky.css                   the fixed atmosphere
    aurora.css                the aurora — ported verbatim
    chrome.css                intro · rail · header · footer
    sections.css              hero · marquee · services · about · work · contact
    case.css                  the /work/* pages
```

### Why the CSS is plain CSS, not Tailwind classes

The aurora masks, the SVG filter wiring and the scroll-driven custom
properties were tuned by hand. Rewriting them as utility classes would have
meant retyping every tuned number, and Tailwind cannot express
`mask-composite: intersect` over two mask layers anyway. The tokens are
mirrored into `tailwind.config.js` so anything *new* can use utilities; the
raw CSS variables stay the source of truth because the scroll engine writes
three of them at runtime.

---

## Rules that are not up for renegotiation

1. **The journey drives everything.** Any new section must sit sensibly on the
   Oslo→Dubai gradient. Never give a section its own flat background colour —
   that produces a visible hard seam partway down the page.
2. **Saffron is the only accent colour.** It is both Nordic golden-hour light
   and Gulf desert light. Don't add a second one.
3. **The aurora is a homepage hero element only.** No aurora, no second
   animated background, on the case-study pages or anywhere else.
4. **Restraint below the fold.** Hairlines, space and type. No cards, no
   shadows, no gradients on buttons.
5. **Never let decoration beat the type.** If an effect reduces headline
   contrast, dim the effect, not the text.

### Smaller decisions that look like mistakes but aren't

- The hero `<h1>` is weight **400**, not 600. It read too heavy at 600 at that
  size. Isolated, deliberate exception — don't "fix" it.
- Arsalan Mahmood's partner title has **no separator**; the other two use a
  `-` hyphen. Deliberate, not inconsistent.
- The four service headings carry **no sub-taglines**. An earlier version had
  one under each; they were removed.
- Client labels in the Work section are **anonymised sector names**. The real
  former employers behind "Consumer finance" and "Vehicle leasing" must not be
  named anywhere on the site. This is a compliance requirement, not a style
  preference — there is a test that fails if a name creeps back in.
- Focus rings have `transition: none` and don't touch `border-radius`. Both
  were real bugs: a transitioned outline fades in instead of snapping on, and
  a radius override squared off the pills.
- The aurora is `position: absolute` at the top of the **document**, not fixed
  to the viewport. A fixed aurora follows the reader down the page and breaks
  the journey metaphor.
- Reduced motion **keeps** the aurora and stops it moving. Motion sensitivity
  is not a reason to remove the atmosphere.

---

## Tests

`npm test` runs the Playwright suite against **both** builds — the React app on
port 4173, and the original HTML files on port 4174 — so a fix in one can't
silently drift from the other.

| Spec | What it guards |
|---|---|
| `shared/journey.spec.ts` | the latitude readout, `--north`, `--warm`, and that the sky is interpolated rather than stepped |
| `shared/aurora.spec.ts` | three curtains and no fourth glow layer, filters on the static veil only, one-directional passes, absent from case-study pages |
| `shared/content.spec.ts` | the exact copy, the partner separators, the anonymised client labels |
| `shared/a11y.spec.ts` | focus rings, skip link, heading order, no dead `#` links, contrast over the sand, reduced motion, single-accent-colour |
| `shared/navigation.spec.ts` | routing, anchor offsets under the fixed header, responsive behaviour at seven widths, no horizontal overflow |
| `react/routing.spec.ts` | route resolution, 404, client-side nav, single-mount of the filter defs, per-route head tags |

Run one project or one file:

```powershell
npm test -- --project=react
npm test -- --project=legacy
npm test -- tests/shared/journey.spec.ts
npm test -- --headed --project=react       # watch it happen
npm run test:report                        # open the last HTML report
```

Workers default to 1 — each worker is a full Chromium compositing SVG filters
and a blend mode every frame. Raise it on a machine with headroom:
`$env:PW_WORKERS=4; npm test`.

Traces and screenshots are **off by default**. A failing test writes a
multi-megabyte trace zip, and a suite with several failures will fill a small
container disk mid-run — which kills the run and loses the very results you
were trying to capture. Turn them on when you actually need them:

```powershell
$env:PW_TRACE=1; npm test -- -g "the aurora"
npm run test:report
```

---

## Still open

- **LinkedIn URL** is not live. The contact block shows "Follow the studio
  soon" as plain text rather than a link to `#`, which would silently jump to
  the top of the page. Swap it back to an `<a href>` in
  `src/components/Contact.tsx` the moment the URL exists.
- **Case-study copy is drafted, not client-approved.** It was written to fit
  known facts without naming either former employer. It needs an editorial and
  compliance pass before publishing.
- **No analytics.**
- **Not yet tested in Safari or on iOS.** The aurora relies on
  `mask-composite` and SVG filters. There is a `@supports` fallback in
  `aurora.css` for engines that can't intersect two mask layers, but it hasn't
  been verified on real hardware.
- **`mix-blend-mode: screen`** on the aurora band is the one real performance
  cost. It's GPU-accelerated on real hardware but dominant in software
  rendering. If it feels heavy on an older laptop, switching `.aurora-band` to
  `mix-blend-mode: normal` is a safe, nearly invisible fallback over a
  near-black sky.

---

## Deploying

It's a static SPA. Build, then serve `dist/` with a **history fallback** so
`/work/platform-modernisation` returns `index.html` instead of a 404. On
Netlify that's a `_redirects` file containing `/* /index.html 200`; on Vercel
it's the default for Vite projects; on Azure Static Web Apps it's
`navigationFallback` in `staticwebapp.config.json`.
