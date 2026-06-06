# KeepKase — Shopify Theme

A custom Online Store 2.0 theme for the KeepKase 100‑person Alpha. It keeps your
neo‑brutalist landing‑page design and adds everything a real storefront needs:
a product page with an **editable build timeline**, cart + Shopify checkout, an
Alpha signup flow, a post‑purchase Welcome page, Story / Community / Devlog / FAQ
pages, legal pages, customer accounts, search, and a 404.

> **Payments:** this is a full Shopify theme, so checkout, payments, taxes, and
> order emails are handled natively by Shopify once you add a product and turn on
> a payment provider. No extra code or backend required.

---

## 0. Look at it right now (no install)

A static preview lives in **`../preview/`** — open it in any browser:

- `preview/index.html` — the home page
- `preview/product.html` — the product page **with the live, editable timeline**

Everything works offline except checkout (that only exists on the real Shopify
store). Try the timeline: scroll to **The road to launch**, hit **Edit timeline**,
then **Split** the *Packaging design* node into a sub‑step.

---

## 1. Install the theme on Shopify

**Option A — Upload (easiest)**
1. Zip the **contents** of the `keepkase-theme/` folder (so `layout/`, `sections/`,
   `templates/`, etc. are at the root of the zip — not nested inside a folder).
2. Shopify admin → **Online Store → Themes → Add theme → Upload zip file**.
3. Click **Customize** to preview, then **Publish** when ready.

**Option B — Shopify CLI (for developers)**
```bash
npm i -g @shopify/cli @shopify/theme
cd keepkase-theme
shopify theme dev      # live local preview against your store
shopify theme push     # upload to the store
```

---

## 2. One‑time store setup checklist

### a) The Alpha product  ✅ required for checkout
Create one product:
- **Title:** `KeepKase Alpha`
- **Handle:** `keepkase-alpha`  ← links throughout the theme point at
  `/products/keepkase-alpha`. Keep this handle (or update the links).
- **Price:** `$50.00` (this is "at cost" — set a Compare‑at price later if you
  want the savings to show).
- **Inventory:** track quantity, set to `100` (your Alpha cap). When it hits 0 the
  buy button automatically shows **Sold out**.
- **Options / variants (optional but recommended):** add an option named
  **Color** (or "Border colorway") with values **Bone, Graphite, Ember, Signal**.
  The buy box renders these as color swatches automatically (it knows those four
  names; any other names still work, just without a custom dot color).
- Add product photos — they replace the placeholder gallery.

### b) Pages  ✅ create these so the nav/footer links resolve
Shopify auto‑applies a template named `page.<handle>` to a page with that handle.
Create these **Pages** (Online Store → Pages) and pick the matching template in
the page's **Theme template** dropdown:

| Page title | Handle | Template to choose | Content source |
|---|---|---|---|
| Story | `about` | `page.about` | built into the theme |
| Community | `community` | `page.community` | built into the theme |
| FAQ | `faq` | `page.faq` | built into the theme |
| Welcome | `welcome` | `page.welcome` | built into the theme |
| Contact | `contact` | `page.contact` | built into the theme |
| Devlog | `devlog` | `page.devlog` | built into the theme |
| Build timeline | `timeline` | `page.timeline` | the interactive timeline |
| Privacy Policy | `privacy` | `Default page` | paste `content/legal-privacy.md` |
| Terms of Service | `terms` | `Default page` | paste `content/legal-terms.md` |
| Refund & Returns | `refund-policy` | `Default page` | paste `content/legal-refund.md` |
| Shipping | `shipping` | `Default page` | paste `content/legal-shipping.md` |

> The Story/Community/FAQ/Welcome/Devlog pages have their copy **built into the
> theme sections**, so the page body in admin can be left blank — just assign the
> template. The four legal pages render whatever you paste into the page body
> (the polished drafts are in the `content/` folder). The legal pages get a
> "plain‑language draft — have counsel review" banner automatically.

### c) Navigation
Online Store → **Navigation → Main menu**. Suggested links: Home `/`,
The case `/products/keepkase-alpha`, Story `/pages/about`, Devlog `/pages/devlog`,
Community `/pages/community`, FAQ `/pages/faq`. (If you leave the menu empty the
header falls back to a sensible default set.)

### d) Theme settings  ✅
Customize → **Theme settings**:
- **Alpha program:** Discord invite URL, total spots (`100`), spots remaining
  (`87` — update as you sell), support email, ship window, return window,
  supported MacBook models.
- **Social:** Instagram / TikTok / YouTube / X URLs.
- **Brand:** favicon, footer tagline.

### e) Payments
Settings → **Payments** → activate Shopify Payments (or another provider). Use
Shopify's **test mode** / a Bogus Gateway to place a fake order end‑to‑end before
going live.

---

## 3. The build timeline (the centerpiece)

The timeline lives on the product page and on `/pages/timeline`. It's fully
client‑side and needs no database.

**Editing (you, the owner):**
1. Click **Edit timeline**.
2. Use the per‑node tools: **↑ ↓** reorder, **⇥** indent as a sub‑step,
   **⑂ Split**, **✎ Edit**, **🗑 delete**, or drag a node to reorder.
3. **Split** breaks a big node into focused sub‑steps. Example: split
   *Packaging design* → it offers the suggested sub‑steps
   *"Find a recyclable cardboard supplier"* and *"Final dieline & print test"*,
   or type your own. New sub‑steps appear indented right below the parent.
4. **Edit** a node to change its title, status (done / in‑progress / upcoming),
   date, description, milestones, and **links**. Add a link any time — drop in a
   YouTube recap weeks after a node is done and it shows as a chip on that node.
5. Edits **auto‑save to your browser** (localStorage). They do **not** affect
   visitors until you publish (next step).

**Publishing your edits to visitors — two ways:**
- **No‑code (recommended):** in edit mode click **Export JSON** (downloads
  `keepkase-timeline.json`). Open it, copy everything, then in the theme editor go
  to the product's **Build timeline** section → **Published timeline JSON** field
  → paste → Save. Visitors now see your version.
- **In code:** replace the `nodes` array in `assets/timeline.seed.js` with your
  exported JSON and re‑upload the theme.

**Reset:** in edit mode, **Reset to published** discards your local edits and
shows the published version again.

---

## 4. Post‑purchase: Discord + Alpha number

The theme already shows the next steps after purchase:
- The **Welcome page** (`/pages/welcome`) has the full onboarding (join Discord,
  what happens next, the intro ask).
- The **order page** in a customer's account shows a "You're in the Alpha" block
  with the Discord button and a link to the Welcome guide.

To **automatically** hand each buyer their invite + Alpha number, do one of:
1. **Simplest:** Shopify admin → Settings → **Notifications → Order confirmation**
   email. Add a line linking to your Discord invite and to
   `https://yourstore.com/pages/welcome`. Every buyer gets it instantly.
2. **Automated number/role:** use **Shopify Flow** or a Discord‑integration app to
   assign a sequential Alpha number (e.g. via an order metafield) and DM/grant a
   Discord role on the `orders/create` event.

> The "87 of 100 left" counter is a **theme setting** you update manually (or wire
> to the product's real inventory with an app). Update it as spots sell.

---

## 5. Brand voice (for any new copy)

All copy follows the KeepKase philosophy: modern, precise, sincere, un‑hyped.
Avoid the word **"identity"**, don't preach about sustainability, never call it
"rugged," and keep the Alpha facts straight (100 spots, $50 at cost, free waitlist
with an optional **$10 refundable** deposit). The full polished copy for every page
is in the `../content/` folder.

---

## 6. File map

```
keepkase-theme/
├── assets/
│   ├── theme.css            # full design system (tokens, components, responsive)
│   ├── theme.js             # nav, reveal, draggables, AJAX cart drawer, variants
│   ├── timeline.css         # timeline + editor styles
│   ├── timeline.js          # the interactive editor (add/split/delete/reorder/links)
│   └── timeline.seed.js     # the PUBLISHED default timeline data
├── config/                  # settings_schema.json, settings_data.json
├── layout/theme.liquid      # the HTML shell
├── locales/en.default.json
├── sections/                # header, footer, hero, problem, how-it-works,
│                            #   in-the-wild, pick-your-path, testimonials,
│                            #   email-signup, promise, main-product,
│                            #   product-timeline, main-cart, story, community,
│                            #   faq, welcome, devlog, contact, main-page,
│                            #   main-blog, main-article, main-collection,
│                            #   main-list-collections, main-search, main-404
├── snippets/                # meta-tags, price, cart-drawer, product-card
└── templates/               # index, product, cart, page(+about/community/faq/
                             #   welcome/contact/devlog/timeline), blog, article,
                             #   collection, list-collections, search, 404,
                             #   customers/*
```

---

## 7. Notes & corrections

- **Spot count:** your brief said a **100‑person** Alpha, but the original landing
  page mixed in "30 spots / 12 left." This theme standardizes on **100** and makes
  the count a theme setting (`alpha_remaining`, currently `87`). Adjust anytime.
- **Material/spec claims** are intentionally soft ("3D‑printed prototypes,
  materials still being explored") to match the brand's honesty about an alpha.
- **Legal pages** are plain‑language drafts in `content/` — have counsel review
  before launch.
```
