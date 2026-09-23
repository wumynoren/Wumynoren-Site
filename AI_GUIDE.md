# AI_GUIDE.md — instructions for AI assistants editing this site

Read this before touching any file. Also applies to humans.

## 1. What this is
Personal portfolio of VECTOR-7, a military-anime artist from the Russian Federation. Themes: The Fire Rises (HOI4 mod), near-future collapse, ROC / PLA visual language used as graphic motif, not politics. Site must read like an artist's command terminal, not a shop or a campaign page.

Stack: static HTML + CSS + vanilla JS, no build step, no frameworks, no npm. Content lives in `content/*.json`. Deployed to GitHub Pages via `.github/workflows/deploy.yml`.

## 2. Hard rules
1. **Content edits go in JSON, not in JS/HTML.** If a text, price, link, or image needs to change, change the JSON.
2. **Never add a build step, bundler, framework, or npm dependency.** The site must run from `python -m http.server`.
3. **Keep the `{ "EN": ..., "RU": ... }` shape** for every user-facing string you add. Plain strings are allowed only for codes, labels that are identical in both languages (e.g. `OP-01`, `TFR`), and URLs.
4. **Escape everything** rendered from JSON with `esc()` in `app.js`. The only exception is the `html` block type, which is user-authored raw HTML.
5. **JSON must stay valid.** The deploy workflow fails on invalid JSON. No trailing commas, no comments (use `_help` keys for notes).
6. **Do not invent content** (prices, addresses, links, artwork titles). Use obvious placeholders (`#`, `placeholder-address`) and tell the user.
7. **Do not add colour.** 90% black, 8% grey structure, 2% accent. New accents are forbidden.
8. **Do not add emoji, gradients backgrounds, glassmorphism, neon glow, rounded pill buttons, or left-border accent cards.**
9. Keep file paths relative (`assets/img/...`), never absolute (`/assets/...`); the site may live in a repo subfolder.
10. Preserve `id` attributes `about`, `gallery`, `commissions`, `operations`, `support`, `donation-methods` — nav and scroll-spy depend on them.

## 3. Visual system (tokens in `css/style.css → :root`)
| Token | Value | Use |
|---|---|---|
| `--bg` | #000000 | page background |
| `--surface` | #16181C | cards |
| `--raised` | #1D1F23 | card hover |
| `--line` | #2F3336 | all hairlines and borders |
| `--fg` | #E7E9EA | primary text |
| `--fg2` | #71767B | secondary text, labels |
| `--fg3` | #536471 | placeholders, watermark |
| `--violet` | #7B5CFF | primary accent: active nav, progress, primary buttons |
| `--cyan` | #5EEAD4 | role line, ACTIVE status, "copied" confirmation |
| `--gold` | #C9A227 | prices and the donate CTA only |
| `--crimson` | #B42318 | full queue / limited slots only |

Type:
- `--ext` Eurostile Extended Bold: h1 callsign, h2 section titles, card titles (12–13px, tracking 0.06–0.08em).
- `--ui` Eurostile Medium: nav (13px, 0.12em, uppercase), buttons, filter chips.
- `--sans` IBM Plex Sans 300/400: body 15–17px, line-height 1.6. Never set body text in Eurostile.
- `--mono` IBM Plex Mono: section indices (12px, 0.22em), captions, prices, slot counts, codes.
- `--cjk` Noto Serif TC: small title accents (畫廊 委託 計劃 支援) and 5%-opacity watermarks. Never body copy.

Shape and motion: radius 4px, 1px borders, hover 200–300ms ease-out, art frames shift border to violet on hover, captions slide up, progress bars fill on scroll, lightbox fades. No parallax, no typing effects.

Layout: `max-width 1344px`, gutters 48px (20px ≤768px). Sections `padding 112px 0` with a top hairline. Breakpoints: 1120px (nav → burger), 900px (two-column → stack, gallery 2-col), 768px (mobile paddings), 560px (single column everywhere).

Tone of copy: disciplined, dry, specific, short sentences. Military-poetic, not memes, not essays. Example: "I draw the hour after the fire rises: wet asphalt, squadron lights, and uniforms that still remember their country."

## 4. File map and responsibilities
- `index.html` — shell only: `#hdr`, `#menu`, `#lightbox`, `#app`, `#ftr`. Fonts link. Don't add content here.
- `js/app.js` — loads all JSON, holds renderers `R.hero/gallery/commissions/operations/support/block`, chrome (header/menu/footer), gallery grid + lightbox, scroll-spy, language toggle (persisted in `localStorage['v7-lang']`), progress-bar observer, copy buttons.
- `js/blocks.js` — `window.BLOCKS[type](block, ctx)` → HTML string. `ctx = { L, esc, frame, head }`.
- `css/style.css` — tokens, base, header, sections, blocks, footer, responsive. Class-based.
- `content/*.json` — see schemas below.

## 5. JSON schemas

### `site.json`
```
callsign            string
unitCode            string            e.g. "TF-07 / 東方"
year                number
defaultLang         "EN" | "RU"
scanlines           boolean           faint hero scanlines
commissionStatus    "open" | "waitlist" | "closed"
nav[]               { id, label{EN,RU} }      id must match a section id
statusLabels        { open{EN,RU}, waitlist{EN,RU}, closed{EN,RU} }
sections[]          { type: "hero"|"gallery"|"commissions"|"operations"|"support" } | { type:"block", id }
hero                { role{}, paragraphs[{}], tags[string], buttons[{label{},href,style:"outline"|"solid"|"ghost"|"gold"}],
                      art[{src,alt,label,cjk}] (max 3; first is the large one), hud{location{},status{}} }
footer              { disclaimer{}, links[{label,href}] }
```

### `gallery.json`
```
title{}, cjk, filters[string], emptyText{}
items[]  { id (unique), src ("" = placeholder), label, tag (∈ filters), series, year, medium, dims, tools, cjk,
           col "a / b" (1..13), row "a / b" }   col/row optional; only used in the ALL view
```
Grid is 12 columns × 150px rows. Featured tile: `col "1 / 9", row "1 / 3"`. Tall tile: 4 columns × 3 rows. When adding items, extend the row numbers downward; do not leave holes.

### `commissions.json`
```
title{}, cjk
brief[]      { label{}, text{} }
process[]    { step, text{} }
turnaround[] string,  languages[] string
tiers[]      { title, usd, rub, slots, max, items[string] (4 recommended), requestUrl }   slots 0 → QUEUE FULL
terms[]      { k, v{} }
```

### `operations.json`
```
title{}, cjk, tagline{}, currency
items[]    { code, title, sub, status "ACTIVE"|"HOLD"|"COMPLETE", raised, goal, url, objective{} }
timeline[] { date, label{} }
```
`items[0]` is reused as the featured goal in SUPPORT.

### `support.json`
```
title{}, cjk, intro{}, whyLabel{}, why[{}], featuredLabel{}, donateLabel{}, methodsLabel{}
methods[]  { abbr (≤4 chars), name, note, url }  → OPEN button
           { abbr, name, note, copy }             → COPY button
```

### `blocks.json` — custom blocks
Common fields: `id` (unique, becomes the section anchor), `type`, `num` ("06"…), `title{}`, `cjk` (optional).
```
text    paragraphs[{}]
images  images[{src, alt, label, cjk}]
cards   cards[{title{}, text{}, link?{label{},href}}]
cta     heading{}, text{}, button{label{}, href, style}
html    html{}            raw HTML, trusted content only
```
To show a block: add `{ "type": "block", "id": "<id>" }` to `site.json → sections` at the desired position. To add it to the menu: add `{ "id": "<id>", "label": {...} }` to `site.json → nav`.

To create a new block type: add `BLOCKS.<type> = (b, {L, esc, frame, head}) => head(b) + '<div class="blk-<type>">…</div>'` in `js/blocks.js`, then add `.blk-<type>` styles in `css/style.css` using only existing tokens.

## 6. Adding images
- Put files in `assets/img/`, kebab-case names, JPG or WebP, ≤2560px long side, ≤600 KB.
- Reference with relative path `assets/img/name.jpg`.
- Every image gets `alt`. Gallery `dims` should reflect the real pixel size of the original artwork, not the web file.
- No copyrighted anime characters. Original work only.

## 7. Checklist before committing
- [ ] `node -e "JSON.parse(require('fs').readFileSync('content/site.json'))"` passes for every JSON file
- [ ] Every new string has EN and RU
- [ ] New `tag` values exist in `gallery.filters`
- [ ] `nav[].id` values match rendered section ids
- [ ] No new colours, fonts, or dependencies
- [ ] Tested at 1440 / 768 / 390 px widths via a local server
