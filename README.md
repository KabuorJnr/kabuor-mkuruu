# Mkurugenzi

An interactive clothing-rack storefront for the Mkurugenzi (Abel Mutua) merchandise store, built as a WordPress plugin for WooCommerce.

Garments hang side-on from a chrome rail and swing round to face the shopper on hover. Hats, bags and socks hang on hooks on an oak slat wall. Click any piece for a close-up with price, colourway and sizes, add it to the bag, and check out in a clean three-step panel (Bag, Details, Payment).

## Try the demo

Open `demo/index.html` in a browser. On Windows, double-click `demo/Open Mkurugenzi.bat` to open it in Chrome.

The demo uses the bundled catalogue and a demo checkout that takes no payment. It needs an internet connection for the garment photos.

## Install on WordPress

1. Download `dist/mkurugenzi.zip`.
2. In WordPress admin go to **Plugins > Add New > Upload Plugin**, upload the zip and click **Activate**.
3. Add a **Shortcode** block to any page containing:

   ```
   [mkurugenzi]
   ```

   It works in Gutenberg, Elementor (Shortcode widget) and the Classic editor. The older `[mkurugenzi_rack]` shortcode still works.

The rack reads products straight from WooCommerce, so prices, sale prices, sizes (variations), stock and new products stay in sync automatically.

## Bag and checkout

A bag button with a live count sits in the rack header. "Add to bag" opens a slide-out panel:

- **Bag:** change quantities, remove items, see the subtotal. Delivery is shown as calculated at the next step, never hidden.
- **Details:** email, Kenyan mobile number (+254, validated), name, town, delivery address, optional note. The terms consent box starts unticked and is required; the news opt-in is optional and unticked.
- **Payment:** order summary, the store's delivery options, and the payment methods the store has switched on (for example Lipa na M-Pesa or a card gateway), with the full total on the button.

It runs on the WooCommerce Store API, so the bag is the store's real cart and orders appear in WooCommerce as normal. Placing the order hands the shopper to the store's payment gateway to pay, so card numbers are never typed into this page. If a gateway needs extra fields, the panel offers a link to finish on the normal checkout page.

## Shortcode options

| Option | Default | Example |
|---|---|---|
| `category` | all products | `[mkurugenzi category="men,unisex"]` (WooCommerce category slugs) |
| `limit` | `60` | `[mkurugenzi limit="20"]` |
| `hide_out_of_stock` | `no` | `yes` removes sold out pieces; otherwise they hang faded and marked "Sold out" |
| `title` | `The Rack` | `[mkurugenzi title="New season"]` |
| `ticker` | brand lines | `[mkurugenzi ticker="Wakurugenzi|New drop Friday|More than just a brand"]` |
| `refund_url` | none | Link to the refund policy shown at checkout |
| `delete_url` | none | Link to the data deletion request page shown at checkout |
| `source` | `auto` | `static` shows the bundled catalogue instead of live WooCommerce data |

Terms and privacy links at checkout come from the WooCommerce and WordPress settings.

## How pieces are sorted

Pieces are placed from their product names ("Garment – Colourway", the store's current convention):

- **Rails** (at most 10 pieces each): Tees; Tops & Trousers (hoodies, quarter zips, jackets, sweatpants); Sweatsuits
- **Wall:** beanies, caps, bucket hats, tote bags, socks

## Photos

Every piece is shown as a studio cut-out on its hanger. The cut-outs were generated from the store's own product photos and packed into one image sheet (`MKR_ATLAS` in `assets/products.js`). WooCommerce products are matched to their cut-out by garment and colourway. `tools/pack_atlas.py` documents how the sheet was made.

The sheet is currently hosted on Higgsfield's CDN. For production, download it into `assets/` and point `MKR_ATLAS.url` at the local copy. New products without a cut-out fall back to their normal product photo.

These images are AI-generated renders based on the real products. Have the brand approve them before they go on the live store.

## Privacy, accessibility and compliance

- No cookies of its own, no localStorage, no tracking or analytics. Fonts (Inter and Instrument Serif, SIL Open Font License, licences in `assets/fonts/`) are self-hosted.
- Collects only what is needed to deliver an order, and only sends it to the store's own WooCommerce checkout.
- Every piece is a real button with a descriptive label. There is full keyboard support: arrow keys along the rail, Enter to open, Esc to close, and focus is kept inside open panels.
- Text meets WCAG AA contrast, and the system "reduce motion" setting is honoured.

## Project layout

```
mkurugenzi.php        WordPress plugin: shortcode, WooCommerce product feed, checkout settings
assets/rack.css       Styles, all scoped under .mkr / .mkc so the theme is untouched
assets/rack.js        Rail, wall, close-up view
assets/cart.js        Bag and checkout panel (WooCommerce Store API, demo mode)
assets/products.js    Garment image sheet map + fallback catalogue
assets/fonts/         Self-hosted OFL fonts and licences
preview.html          Development preview using the files in assets/
demo/                 Self-contained demo page and Chrome launcher
dist/mkurugenzi.zip   Ready-to-upload plugin
tools/build.py        Rebuilds demo/index.html and dist/mkurugenzi.zip
tools/pack_atlas.py   Builds the garment image sheet from green-screen renders
```

After changing anything in `assets/`, run `python3 tools/build.py`.

## Licence

Plugin code: GPL-2.0-or-later (WordPress plugin licensing). Fonts: SIL Open Font License 1.1. Product names, prints and brand belong to Mkurugenzi.
