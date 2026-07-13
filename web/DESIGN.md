# CaLí Dinner Club — Design Specification

Reference for the site redesign. Extracted from the design prototype
`CaLi Middagskalender - riktningar.dc.html` (direction 1b — gallery, dark mode +
profile, login & admin).

The prototype is HTML/CSS — **recreate the visual result**, not the prototype's DOM
structure. Build in whatever technology fits the codebase.

All UI copy stays in Swedish; this document is in English, but the strings quoted below
are the actual product copy.

> **Read "Open questions" at the bottom before you start.** There's a deliberate
> ambiguity around light/dark mode that should be confirmed with the client.

---

## 1. Character of the design

Scandinavian, restrained, editorial. Almost no chrome: hairline rules instead of cards
and boxes, generous whitespace, a single accent colour used sparingly.

Four load-bearing principles — do not break them:

1. **No rounded corners on buttons or fields.** Radius 0. The exceptions are pill tags
   (`100px`), the notes field (`3px`) and avatar circles (`50%`).
2. **No boxed inputs.** A field is a line of text with a hairline underneath
   (`border-bottom`).
3. **No shadows, no surface fills.** Sections are separated by 1px low-opacity rules,
   not by cards.
4. **Serif for content, sans for interface.** Headings, dinner names, numbers and person
   names are set in Cormorant Garamond. Everything that is UI — navigation, labels,
   buttons, metadata — is set in Archivo.

Signature details: uppercase labels with extremely wide tracking (`.24em`–`.42em`), the
`✦` glyph for secret locations and for the magic link, and the gold accent used *only*
for status that concerns the signed-in person ("Du kommer", "Medlem sedan 2024").

---

## 2. Typefaces

Loaded from Google Fonts:

```
Cormorant Garamond — 300, 400, 500, 600 (+ 400 italic)
Archivo             — 400, 500, 600, 700
```

| Role | Typeface |
|---|---|
| Display: headings, dinner names, person names, stat numbers, wordmark | `'Cormorant Garamond', serif` |
| UI/body: navigation, labels, buttons, tables, metadata | `'Archivo', sans-serif` |

The prototype also loads Newsreader and Hanken Grotesk — these are **not** used by the
design (only by the design tool's own chrome). Ignore them.

### Type scale — desktop

| Element | Spec |
|---|---|
| Hero heading (`Höstens första`) | Cormorant 300, 66px / .98, `letter-spacing:-.01em` |
| Login wordmark | Cormorant 400, 56px, `letter-spacing:.02em` |
| Page heading (`Logga in`) | Cormorant 300, 34px |
| Name / section heading (`John Doe`, `Kommande middagar`) | Cormorant 400, 26–28px / 1.1 |
| Dinner name in grid | Cormorant 400, 26px / 1.05 |
| Dinner name in table row | Cormorant 400, 18px |
| Stat numbers (12 / 34) | Cormorant 400, 26px |
| Header logo | Cormorant 500, 28px |
| Eyebrow / kicker (`NÄSTA MIDDAG · FRE 5 SEP`) | Archivo 400, 10px, `.42em`, uppercase |
| Section label (`KONTO`, `ALLERGIER & KOST`) | Archivo 400, 10px, `.28em`, uppercase |
| Field label (`NAMN`, `EPOST`) | Archivo 400, 10px, `.14em`, uppercase |
| Table column header | Archivo 400, 9.5px, `.16em`, uppercase |
| Navigation | Archivo 400, 12px, `.06em`, uppercase |
| Button text | Archivo 400, 12px, `.08em`, uppercase |
| Body (hero) | Archivo 400, 13.5px / 1.7, max 46ch |
| Body (elsewhere) | Archivo 400, 13px / 1.6 |
| Metadata / helper text | Archivo 400, 11–11.5px |

### Type scale — mobile

Same system, scaled down: hero 44px, page heading 32px, logo 22px, body 12px / 1.65,
eyebrow 9px `.36em`, buttons 11px (full-width), field labels 9px.

---

## 3. Colour tokens

Two themes. Same structure, different values — build them as CSS variables so a surface
can switch without the layout changing.

### Dark theme

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#191712` | Page background |
| `--text` | `#F1ECE2` | Primary text |
| `--text-body` | `#B7B1A3` | Body copy |
| `--text-muted` | `#928C7E` | Labels, metadata, helper text |
| `--text-faint` | `#6F6A5F` | Inactive navigation |
| `--text-dim` | `#3E3A32` | Separators in the meta row (`·`) |
| `--accent` | `#C79A6B` | Eyebrow, my own status, active tab indicator |
| `--line` | `rgba(241,236,226,.12)` | Hairlines, section dividers |
| `--line-strong` | `rgba(241,236,226,.28)` | Field underline, secondary button border |
| `--line-soft` | `rgba(241,236,226,.10)` | List rows |
| Primary button | bg `#F1ECE2`, text `#191712` | |
| Secondary button | transparent, border `--line-strong`, text `--text` | |

### Light theme

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#FBFAF7` | Page background |
| `--text` | `#1B1A17` | Primary text |
| `--text-body` | `#5C594F` | Body copy, table cells |
| `--text-muted` | `#8B8778` | Labels, metadata |
| `--text-faint` | `#B0ACA0` | Inactive navigation, placeholder |
| `--accent` | `#B08356` | Eyebrow, `ENDAST FÖR INBJUDNA`, `MEDLEM SEDAN 2024` |
| `--line` | `rgba(27,26,23,.12)` | Section dividers |
| `--line-strong` | `rgba(27,26,23,.35)` | Active field underline |
| `--line-soft` | `rgba(27,26,23,.09)` | Table rows |
| `--line-input` | `rgba(27,26,23,.14)` | Inactive/read-only field underline |
| `--line-chip` | `rgba(27,26,23,.25)` | Pill border |
| Primary button | bg `#1B1A17`, text `#FBFAF7` | |
| Secondary button | transparent, border `rgba(27,26,23,.2)`, text `--text-muted` | |

### Status

| Status | Light | Dark |
|---|---|---|
| Publicerad | text `#5B7A4E`, border `rgba(91,122,78,.4)` | same green |
| Utkast | text `--text-muted`, border `rgba(27,26,23,.2)` | `--text-muted` / `--line-strong` |

Badge: 10px, `letter-spacing:.08em`, `padding:3px 9px`, `border-radius:100px`, 1px
border, no fill.

The accent is **not** decoration. Use it only where something concerns the signed-in
person or marks exclusivity. If it appears in three places in one view, that's a bug.

---

## 4. Layout & measurements

- **Desktop content width:** 760px, centred.
- **Mobile:** designed against a 278px content width (the iPhone frame in the prototype
  is presentation only — don't build the frame). Side padding 22–24px.
- **Header:** logo left (wordmark + `DINNER CLUB` as an eyebrow, baseline-aligned, gap
  11px), navigation right (gap 30px) with a 30px avatar circle last. Margin below the
  header: 56px (calendar), 52px (profile), 40px (admin).
- **Avatar:** circle with initials. Dark theme = 1px border, transparent fill. Light
  theme = filled `#1B1A17` with light text.
- **Buttons:** primary `padding:12px 30px`; secondary `12px 26px`; admin primary
  `11px 22px`. Always uppercase, `.08em` tracking, radius 0. On mobile: full width,
  `padding:13px`.

### Components

**Pill (allergy/diet):** `padding:7px 15px`, radius 100px, 1px border `--line-chip`,
12px text. The "add" pill has a dashed border and muted text.

**Field:** uppercase label above (10px, `.14em`, `--text-muted`), the value at 15px with
a `border-bottom` + `padding-bottom:9px`. Active/editable field = `--line-strong`,
read-only = `--line-input`.

**Notes field ("Övrigt att notera"):** the only boxed element. 1px border, radius 3px,
`padding:12px 13px`, `min-height:38px`, 13px / 1.5.

**Tabs (admin):** uppercase 12px, `padding-bottom:12px`, active tab marked with
`border-bottom:1.5px` — in the accent colour in dark theme, in `--text` in light theme.

---

## 5. Views

### 5.1 Dinner calendar (home)

Three blocks, top to bottom:

1. **Header** — logo, nav (`Middagar` active, `Leaderboard`, `Profil`), avatar.
2. **Hero, centred**, closed off with a hairline (`padding-bottom:52px`):
   - Eyebrow: `NÄSTA MIDDAG · FRE 5 SEP` in the accent colour.
   - Heading at 66px.
   - Intro paragraph, max 46ch, centred. Key details (time/date) are lifted to `--text`
     against the surrounding `--text-body`.
   - Two buttons side by side: `Jag kommer` (primary), `Kan inte` (secondary).
   - Meta row, 11px, separated by `·` in `--text-dim`:
     time · host · attendance count (`8 av 12`) · **my own status in the accent colour**
     (`Du kommer, +1`).
3. **Upcoming dinners** — 3-column grid (`1fr 1fr 1fr`), separated by vertical hairlines,
   not by cards. Each column: date + time as an uppercase label (10px, `.24em`), dinner
   name in Cormorant 26px, location at 11.5px `--text-muted`.
   A secret location is spelled out as text (`Hemlig plats`) — no icon here.
   The outer columns have zero outer padding so text aligns with the content width.

**Mobile:** everything centred, hero heading 44px on two lines, full-width `Jag kommer`
button, my status as a line underneath. Upcoming dinners become a left-aligned list
(date label + name), separated by a hairline above. `Kan inte` is de-prioritised on
mobile — confirm how it should be reached (see open questions).

### 5.2 Profile

Two columns: left column 224px, right column flexible, gap 56px.

**Left (centred):** 96px avatar with initials in Cormorant 38px, name at 28px,
`MEDLEM SEDAN 2024` in the accent colour, then two stats (`12 MIDDAGAR`, `34 BETYG`)
above a hairline.

**Right:**
- Section `KONTO`: Name (editable), then Email + Role side by side (both read-only —
  muted text and a weaker underline).
- Section `ALLERGIER & KOST`: pills with `✕` to remove + a dashed `+ Lägg till` pill.
- `ÖVRIGT ATT NOTERA`: free-text field.
- Closes with `Spara` (primary) + `Logga ut` (secondary).

**Mobile:** same content, stacked and centred. Avatar 78px. The stats are framed by a
hairline above *and* below. The form section is left-aligned. `Spara` is full width.
Email/Role and the notes field are omitted from the mobile mock — confirm whether they
should be included.

### 5.3 Login (magic link)

Fully centred view, no navigation.

- Top left: `CaLí · DINNER CLUB` as an eyebrow (9px, `.4em`).
- Top right: badge `ENDAST FÖR INBJUDNA` — pill, accent colour, 1px border.
- Centre: wordmark at 56px, `DINNER CLUB` beneath it at `.42em`, heading `Logga in`,
  one sentence explaining the magic-link flow (max 38ch).
- Form, 340px wide: field label `EPOST`, underlined field, full-width button
  `Skicka inloggningslänk`.

**Sent state** (shown in the mobile mock, applies to both breakpoints): 56px circle with
`✦` in the accent colour, heading `Kolla din epost`, copy where the address is lifted to
`--text`, and at the bottom `FICK DU INGET? SKICKA IGEN` as an uppercase label (10px,
`.16em`) — this functions as the secondary action.

### 5.4 Admin

- Header: logo with the eyebrow `DINNER CLUB · ADMIN`, avatar. No main navigation.
- Tabs: `Middagar` / `Inbjudningar`.

**Middagar tab:** heading row (`Kommande middagar` + subheading) with the `+ Ny middag`
button right-aligned. Below it a table — not a card, but rows separated by hairlines.
Columns: `1.6fr 1fr 1.2fr .8fr auto`, gap 16px.

| Column | Content |
|---|---|
| MIDDAG | Cormorant 18px |
| DATUM | `5 sep · 19:00` |
| PLATS | `✦ Hemlig plats` or an address |
| STATUS | Badge: Publicerad / Utkast |
| — | `Redigera · Ta bort`, 11px, `--text-muted` |

`✦` prefixes a secret location **in admin** (unlike the calendar).

**Inbjudningar tab:** heading + explanation, then a row with an underlined email field
and a `Lägg till` button (accent-filled in dark theme: `#C79A6B` background, dark text).
Below it a list of invitees: address + `Tillagd: 2 sep` at 9.5px, with `✕` on the right.

---

## 6. Quality floor

- Responsive all the way down to 320px.
- Visible keyboard focus. The design defines no hover/focus states — introduce them
  discreetly: a 1px accent underline on fields, an opacity shift on buttons.
- Respect `prefers-reduced-motion`. The design is fundamentally still; if you add motion,
  keep it to soft fades.
- Contrast: `--text-muted` against `--bg` sits close to the limit in both themes. Do
  **not** use it for text that must be read (error messages, instructions) — labels and
  metadata only.
- Proper semantics: buttons are `<button>`, the admin table is a `<table>` or a properly
  role-annotated grid, fields have `<label>`.
- Language: Swedish throughout. Date format `5 sep · 19:00`, uppercase labels
  `05 DEC · 18:00`.

---

## 7. Open questions — confirm before implementing

1. **Light or dark as the default?** The prototype shows the calendar in dark mode on
   desktop but profile, login and admin in light — and all of them in dark on mobile.
   The likely reading is that two themes are being presented in parallel, not that each
   page has a fixed mode. **Recommendation:** build both themes as tokens, pick one as
   the default (dark reads as the product's face) and add a toggle. Confirm.
2. **Leaderboard** appears in the navigation but has no design. Should it be built now?
3. **Ratings** are implied (`34 BETYG` on the profile) but have no view. Out of scope?
4. **The `Kan inte` button on mobile** is missing from the mock. Always visible, or a
   secondary action?
5. **Email/Role and the notes field** are missing from the mobile profile. Deliberately
   omitted, or just not drawn?
6. **Google Fonts** — is loading them externally fine, or should the fonts be self-hosted?
