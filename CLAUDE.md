# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**RehaVerse** — a single-page, dependency-free UI prototype for an adaptive pediatric hand-rehabilitation platform (children with cerebral palsy). The UI text is Thai; keep new user-facing strings in Thai to match. This is a *prototype*: all patient data is simulated, grip force is faked via mouse drag instead of real FSR sensors, and this is stated in the footer (`topbar()`).

## Running / building / testing

There is no build step, package manager, lint config, or test suite. It is three static files: [index.html](index.html), [style.css](style.css), [app.js](app.js).

- **Run:** open [index.html](index.html) directly in a browser (or serve the folder over any static server). No compile.
- **Reset stored data:** in the browser console run
  `localStorage.removeItem('rehaverse.profiles.v1'); localStorage.removeItem('rehaverse.codeSeq.v1');` then refresh.

## Architecture

The JS lives in [js/](js/) as plain classic scripts — no modules, no bundler, no framework. `index.html` loads them **in dependency order and the order matters**:

| file | holds |
|---|---|
| [core.js](js/core.js) | `$`/`clamp`/`mean`/`r1` helpers and `const SC={}` — must load first, every screen file writes into `SC` |
| [data.js](js/data.js) | `DIMS`, `LEVELS`, `MODE_META`, `KID_LINE`, `SKILLS`, profiles + localStorage |
| [engine.js](js/engine.js) | adaptive engine, `simulate()`, mode recommendation |
| [feedback.js](js/feedback.js) | sound/`speak()`/`celebrate()`, mascot, `backBtn`, `nodeBar`, help panel, assist bar, forgiving hit area |
| [screens.js](js/screens.js) | child screens |
| [game.js](js/game.js) | `FX` particles, `G` state, `SC.game`, `mountGame()` |
| [dashboard.js](js/dashboard.js) | therapist dashboard, editor, charts, `METHODS` |
| [app.js](js/app.js) | `S`/`H` state, `topbar()`, `render()`, event delegation — **loads last because its final line is the `render()` that boots the app** |

Top-level `const`/`let` in classic scripts share one global lexical environment, so cross-file references resolve at call time. Anything evaluated *at load time* (e.g. `const PROFILES=loadStore()`) must have its dependencies in an earlier file.

### Screen router (the backbone)
- `SC` is an object mapping a screen name → a function returning an **HTML string**. `S.screen` holds the current name.
- `render()` ([app.js:1084](app.js#L1084)) sets `#root.innerHTML = SC[S.screen]()`, then calls `topbar()`, and calls `mountGame()` only when on the `game` screen (the game needs live JS + canvas after the HTML is in the DOM).
- **All interaction is delegated** through two document-level listeners (`click` at [app.js:1093](app.js#L1093), `input` at [app.js:1128](app.js#L1128)) that read `data-*` attributes (`data-go`, `data-kid`, `data-mode`, `data-path`, `data-f`, etc.). To add a control, emit the right `data-*` attribute in the screen's HTML and handle it in these listeners — do not attach per-element handlers inside `SC.*`.
- Screens: `login → pick/code → toy → mode → home → game → reward`, plus `skills` (child) and `dash`/`editor` (professional).

### Two "faces" (child vs. professional) — the most important rule here
`body[data-face]` is toggled to `child` or `pro` by `topbar()` based on the current screen (`dash`/`editor` are `pro`). [style.css](style.css) themes everything off this attribute.

**These are two different products for two different readers, and content must not leak between them.**

- **Child face** (`login → pick → toy → mode → home → game → reward`, `skills`) — the user is a child with **cerebral palsy, global developmental delay, or developmental coordination disorder**. The design constraints are clinical, not aesthetic, and the values in `:root` are not adjustable by taste:
  - `--tap: 96px` minimum on every interactive element; `--gap: 40px` dead space between them (hand tremor / spatial misjudgement). `.screen`, `.stack`, and `.pair` all use `--gap` because their direct children are usually buttons — compress element *sizes* to save space, never this gap.
  - `--bw: 4px` solid `--edge` border plus a solid drop-shadow under every control, so the tap boundary is unmistakable and the button reads as physically pressable.
  - **Dark theme is a clinical requirement, not a style**: white backgrounds cause glare and eye fatigue for children with cortical visual impairment. Background is a night-sky gradient; interactive surfaces are bright pastels (`--cyan` `#98DFEA`, `--yellow` `#FFD166`) with `--ink` text on them.
  - Single column, **max 3 choices per screen**, secondary destinations hidden behind the Help panel (`openHelp` injects them) rather than added to the screen.
  - **Single tap only.** No drag, swipe, pinch, slider, or press-and-hold. The game's force input is two tap-to-step buttons calling `gBump(±1)`; they are real `<button>`s so keyboard and switch access work for free.
  - **No timers, countdowns, or speed scoring.** Force does not decay, so a child has unlimited time to aim. There is one invisible 60s trial cap that exists only to give the adaptive engine a failure signal — it is never surfaced on screen.
  - Minimum 24px text. Colour never carries meaning alone — always paired with ✓ / ✕ / ★.
  - `speak()` reads every control aloud on focus and hover (`th-TH`); `celebrate()` fires visual + audio + haptic together on success. Both respect `prefers-reduced-motion` for the shake.
  - A 15px forgiving hit area (`nearestControl`) redirects near-misses to the closest button — hands slip exactly at the moment of tapping.
  - `.assist` (Home + Help) is fixed in the same screen position on every child screen; it is hidden on adult screens (`login`, `code`, `dash`, `editor`).
- **Pro face** (`dash`, `editor`) — the user is a therapist. Density, formulas, tables, and confidence intervals belong here, and *only* here.

**Every rule in the pro section of [style.css](style.css) is scoped under `body[data-face="pro"]`** — including selectors inside `@media` blocks. The two faces share one stylesheet and collide otherwise: unscoped `.stack`, `.rec`, and `.field` from the dashboard silently overrode the child system's button spacing, label size, and form controls. If you add a dashboard rule, scope it.

When adding a feature, decide which face owns it first. Clinical detail (level goals, adaptable dimensions, live engine parameters, skill taxonomies, per-metric methodology) belongs to the dashboard; the child screens deliberately do not show it. Resist the pull to "helpfully" surface engine internals in the child UI — that is what made the first version unusable for its actual user.

### Adaptive difficulty engine
The conceptual core. `newEngine`/`updateEngine`/`stepDim` ([app.js:79](app.js#L79)+).
- Difficulty is a set of dimensions defined in `DIMS`; each knows its min/max/step and which direction (`harder`) is harder.
- The engine keeps a **rolling window of the last 5 trial results** and adjusts **one dimension at a time**, walking through `PRIORITY = ['hold_time','tolerance_band','target_force']`.
- Targets a 70–80% success rate (Challenge Point Framework): ≥0.80 for 2 windows → harder; <0.55 → one step easier; <0.30 for 2 windows → two steps easier + change game. This asymmetry (up needs confirmation, down is immediate) is intentional.

### Simulated learner
`simulate(p)` ([app.js:98](app.js#L98)) generates a full fake trial history from a profile's parameters (`ability`, `learn`, `nTrials`, `start`, calibration) by running the **same real adaptive engine** the live game uses. Uses seeded RNG (`mulberry32` + `hash(code)`) so a given profile always produces the same history. This is what fills the dashboard charts and the editor's live preview (`edPreview`).

### AI recommendation engine
`recommendScores`/`recommendMode` ([app.js:121](app.js#L121)+) scores Toy-only / Game-only / Toy+Game modes from `ability`, `screenEngagement`, `attentionSpan` and recommends one (falls back to game-only when `hasToy` is false). `weeklyRecommendationTrail` projects how the recommendation shifts as ability grows.

### The game (`SC.game` + `mountGame`)
A "squeeze into the target band and hold" mini-game. The child sees **no numbers** — feedback is purely visual (a gauge, a directional arrow, particle bursts). `mountGame` ([app.js:537](app.js#L537)) wires pointer/keyboard input into `G.target`, runs a `requestAnimationFrame` loop that smooths force, checks the target band from `H.engine.diff`, and on a completed hold calls `endTrial(ok)` which pushes a trial, feeds the engine, and triggers VFX. `FX` ([app.js:223](app.js#L223)) is a small canvas particle system attached to the `#fx` canvas.

### Metrics & dashboard
Trials carry `GSI, GAS, GES, RT, GDI` scores. The `METHODS` array ([app.js:886](app.js#L886)) documents each metric's formula/rationale and is rendered verbatim into the dashboard's methodology section — if you change how a metric is computed, update its `METHODS` entry too. Charts (`chartConvergence`, `chartDifficulty`, `radar`, `heat`, `spark`) are hand-built inline SVG strings. `slopeCI` does a real linear regression with a 95% CI for the weekly-slope reporting.

### State & persistence
- `S` = UI/session state (current screen, selected profile `S.p`, editor draft). `H` = the currently loaded history (`{trials, engine}`), set by `loadProfile`. `G` = transient live-game state.
- Profiles persist to `localStorage` (`STORE_KEY='rehaverse.profiles.v1'`, seq `SEQ_KEY`). `loadStore()` seeds from `SEED_PROFILES` on first run; `saveStore()` is called after any create/edit/delete. Profile codes are auto-issued as `CP-0NNN` via `nextCode()`.

## Conventions in this codebase

- Code is written **terse on purpose**: single-letter helpers (`$`, `clamp`, `mean`, `r1`), packed one-liners, minimal whitespace. Match that density rather than expanding it.
- Comments are in Thai. Keep them.
- Screen functions return strings and must stay side-effect-free; put behavior in the delegated listeners or in `mountGame`.

---

# Design standards

This project is judged on how it looks. Design work here is not decoration applied at the end — it is the deliverable. The bar is "a designer made deliberate choices," not "an AI generated something plausible."

## Never ship a "vibe-coded" look

There is a recognizable default aesthetic that AI-generated sites fall into. It reads as generic and unconsidered on sight. **Avoid it.** Specifically, do not reach for:

- **Purple/violet gradients.** This is the single loudest tell — the indigo→purple→fuchsia sweep (`#6366F1`, `#7C3AED`, `#A855F7`, `#D946EF`), especially as a hero background or as gradient-filled headline text. Also avoid its cousins: teal→purple, pink→orange "sunset" washes, and any large-area gradient used because a flat color felt too plain.
- **Gradient text on the main headline.** Set headlines in a real color.
- **Glassmorphism everywhere** — translucent cards with `backdrop-filter: blur()` stacked over a blurry colorful blob background.
- **Neon glow** on every interactive element; drop shadows tinted with the accent color to make things "pop."
- **The identical-card grid.** Three or four cards, same size, same `border-radius`, same shadow, each with a large emoji as its icon and two lines of filler text.
- **Everything centered.** A centered pill badge, centered giant headline, centered subtitle, centered button pair, repeated down the page. Real layouts use asymmetry, alignment to a grid, and varied rhythm.
- **Default-font-everything.** Inter (or the system stack) at three weights for the entire page, with headline and body distinguished only by size.
- **Filler chrome:** "✨ Powered by AI" badges, `Get Started` / `Learn More` button pairs, meaningless dashboard sparklines, lorem-flavored feature copy.

If a design decision was made because it was the easy default, it is probably one of these. Make a different, specific choice and be able to say why.

## Follow the design references the user gives

When the user supplies a reference — a screenshot, a URL, a brand, "make it feel like X" — **that reference governs.** Study it before writing CSS and extract, concretely: its palette (pull actual hex values), its type pairing and weight range, its spacing rhythm and density, its corner radii, its use of borders vs. shadows vs. neither, and its overall temperature and contrast. Then build to those. Do not blend the reference with your own defaults, and do not quietly substitute a "close enough" color or typeface. If a reference conflicts with what is already in the codebase, ask which wins rather than guessing.

Absent a reference, inherit from **this project's existing system**, which is already deliberate and non-generic — stay inside it rather than inventing a parallel one:

- **Palette** — the tokens at the top of [style.css](style.css): sea teals (`--sea`, `--sea-deep`, `--sea-mid`, `--sea-light`), warm sand (`--sand`, `--sand-2`), mango accent (`--mango`), guava (`--guava`), leaf greens, deep ink (`--ink`). The professional face uses a separate cool-grey clinical set (`--pro-*`). There is no purple in this project — do not introduce one.
- **Type** — `--fd` Mitr for display/headings, `--fb` IBM Plex Sans Thai for body, `--fm` IBM Plex Mono for data, codes, and labels. Mono for anything numeric or identifier-like is a real convention here; keep it.
- **Spacing and radii** — use the `--s1`…`--s6` and `--rl`/`--rm`/`--rs` scales. Do not hardcode one-off pixel values when a token fits.

## Typography must be considered

Type carries most of the perceived quality. Requirements:

- **Choose typefaces on purpose.** A display face with actual character for headings, paired with a highly readable text face for body. Never let the whole page ride on one default sans.
- **Build a real hierarchy** — differentiate levels by weight, size, color, letter-spacing, and case together, not by size alone. Note the existing `.eyebrow` pattern (mono, small, uppercase, wide tracking, muted) as an example of a considered label style.
- **Set body text for reading:** generous line-height (this project uses ~1.6–1.75) and a bounded measure (`max-width` around 56–70ch — see `.kh p`).
- **Load fonts properly.** Preconnect, subset to the weights actually used, and include full fallback stacks. Because the UI is Thai, every font stack must contain a face with real Thai coverage — verify Thai glyphs render correctly and don't fall back mid-sentence.

## Responsive is a requirement, not a pass

Every screen must be genuinely good on both desktop and mobile — not merely un-broken at narrow widths.

- Design and verify at, at minimum: **375px** (small phone), **768px** (tablet), **1280px** and **1440px+** (desktop). Existing breakpoints cluster at 620/880/900/920px — reuse them rather than adding near-duplicates.
- Multi-column grids must collapse deliberately (see the `.detail`, `.pgrid`, `.edgrid`, `.row2` patterns), and the collapsed order must still read sensibly.
- Fluid type via `clamp()` for headings, as the existing `.kh h1` and skill-tree styles do.
- Touch targets ≥44px. The child-facing UI is used by children, often on touch — err large.
- No horizontal page scroll at any width. Wide content (the level rail, the log table, the sub-nav) scrolls inside its own container, which is the pattern already in use.
- The game stage and skill tree are aspect-ratio-locked SVG/canvas — confirm they scale without clipping or distortion, and that `FX.resize()` still maps correctly, after any layout change.

## Always verify your own work

Do not report design work as finished based on the code alone. After any visual change:

1. **Open the page and actually look at it.** Use the `run` skill to launch it and take screenshots.
2. **Check every breakpoint listed above**, not just the one you were working in.
3. **Check both faces** — `data-face="child"` (dark) and `data-face="pro"` (light). A change to a shared component must be inspected in both; contrast and borders behave differently across the two themes.
4. **Walk the affected flows end to end.** The full path is `login → pick → toy → mode → home → game → reward`, plus `skills`, and `code → dash → editor`. Screens are string-rendered with no type checking, so a template mistake surfaces only when the screen is visited.
5. **Check the console** for errors, and confirm keyboard focus rings are visible (`:focus-visible` is styled per-face) and that `prefers-reduced-motion` is still honored.
6. **Re-read your own screenshot critically** against the "vibe-coded" list above before calling it done. If it looks like a template, it is not finished.

State plainly what you verified and what you did not. Never claim a design works at a size or in a theme you did not view.
