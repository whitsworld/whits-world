# HOW TO UPDATE WHIT'S WORLD

This is your plain-English manual for running Whit's World. You don't need to know how to code to use this site — you (or any AI coding assistant you hand this project to) just need to know which file to open.

If you ever hand this whole folder to an AI assistant and say "add this to my Home finds," this document is what it should read first.

---

## TABLE OF CONTENTS

1. [How this site is organized (read this first)](#1-how-this-site-is-organized-read-this-first)
2. [How to preview the website](#2-how-to-preview-the-website)
3. [How to publish updates](#3-how-to-publish-updates)
4. [How to change homepage text](#4-how-to-change-homepage-text)
5. [How to replace a picture](#5-how-to-replace-a-picture)
6. [How to add a recommendation (any product)](#6-how-to-add-a-recommendation-any-product)
7. [How to add an Amazon link](#7-how-to-add-an-amazon-link)
8. [How to mark a link as affiliate](#8-how-to-mark-a-link-as-affiliate)
9. [How to add an outfit](#9-how-to-add-an-outfit)
10. [How to create a "Shop the Look" section](#10-how-to-create-a-shop-the-look-section)
11. [How to create a new collection/content page](#11-how-to-create-a-new-collectioncontent-page)
12. [How to add an Archi product](#12-how-to-add-an-archi-product)
13. [How to change the navigation](#13-how-to-change-the-navigation)
14. [How to change colors](#14-how-to-change-colors)
15. [How to change fonts](#15-how-to-change-fonts)
16. [How to add a domain later](#16-how-to-add-a-domain-later)
17. [How to add a Journal later](#17-how-to-add-a-journal-later)
18. [If something breaks](#18-if-something-breaks)

---

## 1. HOW THIS SITE IS ORGANIZED (read this first)

Everything lives inside the `src` folder. You will basically never need to touch anything outside of it.

```
whits-world/
├── src/
│   ├── _data/
│   │   ├── site.json        <- Site-wide settings: nav menu, brand text, affiliate disclosure wording
│   │   └── products.json    <- EVERY recommendation/product on the whole site lives in this one file
│   │
│   ├── _partials/            <- Reusable building blocks (header, footer, product card, shop the look...)
│   │                            You rarely need to edit these — see the sections below for when you would.
│   │
│   ├── pages/                <- Every actual page on the site. The folder structure IS the URL structure.
│   │   ├── index.html          -> whitsworld.com/
│   │   ├── shop/index.html     -> whitsworld.com/shop/
│   │   ├── style/index.html    -> whitsworld.com/style/
│   │   ├── style/baggy-levis.html -> whitsworld.com/style/baggy-levis/
│   │   ├── home/...
│   │   ├── beauty/...
│   │   └── archi/...
│   │
│   ├── assets/
│   │   ├── css/styles.css    <- The ENTIRE design system (colors, fonts, spacing) lives in one file
│   │   ├── js/main.js        <- The tiny bit of JavaScript (mobile menu, shop filters)
│   │   └── placeholders/     <- Placeholder images — swap these for your real photos
│   │
│   └── static/                <- Files copied as-is: favicon, robots.txt
│
├── build.js                  <- The "engine." Turns everything in /src into a finished website in /dist.
│                                 You should never need to edit this.
├── serve.js                  <- A tiny local preview server. You won't need to edit this either.
├── dist/                      <- The FINISHED website. This gets generated — never edit files in here,
│                                 your changes will be erased next time you build.
└── HOW TO UPDATE WHITS WORLD.md  <- You are here.
```

**The golden rule:** content lives in `src/_data/` and `src/pages/`. Design lives in `src/assets/css/styles.css`. You (or your AI assistant) almost never need to touch anything else, including `build.js`.

### How pages are built

Every page in `src/pages/` starts with a block of information between two `---` lines called **front matter**. It looks like plain JSON (curly braces, quotes around everything). That's where a page's title, description, and any special content (like a photo gallery) lives. Below the second `---` is the actual visible content of the page, written in plain HTML.

```
---
{
  "title": "This shows up in the browser tab and Google",
  "description": "This shows up in Google search results and social previews"
}
---
<p>This is the part visitors actually see.</p>
```

---

## 2. HOW TO PREVIEW THE WEBSITE

Whenever you (or an AI assistant) make a change, you need to "build" the site before you can see it.

1. Open a terminal in the `whits-world` folder.
2. Run:
   ```
   node build.js
   ```
   This reads everything in `src/` and writes the finished website into the `dist/` folder. You'll see a message like `Built 9 pages into /dist in 22ms`.
3. Run:
   ```
   node serve.js
   ```
4. Open **http://localhost:8080** in your browser. That's your site, live, on your own computer.
5. Press `Ctrl + C` in the terminal to stop the preview when you're done.

**Tip for AI assistants:** you can run `node build.js --watch` instead of step 2. It will automatically rebuild every time a file in `src/` changes, so Whitney can just refresh her browser to see updates.

You need [Node.js](https://nodejs.org) installed to do this (free, one-time install). Nothing else — no `npm install`, no extra setup. That's intentional.

---

## 3. HOW TO PUBLISH UPDATES

This site is built to be hosted for free on **Cloudflare Pages**.

**One-time setup:**
1. Put this project in a GitHub repository (Cloudflare Pages deploys from GitHub).
2. In Cloudflare Pages, click "Create a project" → "Connect to Git" → pick your repository.
3. When it asks for build settings, enter:
   - **Build command:** `node build.js`
   - **Build output directory:** `dist`
4. Click deploy. Cloudflare gives you a free `*.pages.dev` address immediately.

**Every time after that**, publishing an update is just:
1. Save your changes to the files in `src/`.
2. Commit and push them to GitHub (`git add .`, `git commit -m "update"`, `git push`).
3. Cloudflare automatically rebuilds and republishes the site within a minute or two. You never run `node build.js` yourself for a real deploy — Cloudflare does it for you using the exact same command.

If you're not using git/GitHub yet, that's the only "technical" piece of this whole system, and it's worth asking an AI assistant to walk you through the one-time setup — after that, publishing is just "save, commit, push."

---

## 4. HOW TO CHANGE HOMEPAGE TEXT

Open **`src/pages/index.html`**.

- The big tagline under the site name ("things I find, wear, make + love") comes from `src/_data/site.json` — the `brand.tagline` field — since it's reused in the footer too.
- Section headings (like "Currently Into" or "At Home") are plain text right in `index.html` — just find the words and edit them.
- The "What I'm Wearing" spotlight has its own text at the very top of `index.html`, inside the `"featuredOutfit"` block (title, note, image, and link).

Save the file, rebuild, and refresh to see your change.

---

## 5. HOW TO REPLACE A PICTURE

Every image on the site is just a path to an image file, written as `"image": "..."` or `src="..."`.

**If you have your own photo to use:**
1. Add your photo file into `src/assets/images/` (create that folder if it isn't there yet — keep filenames simple, like `fall-boots.jpg`).
2. Find the placeholder path you want to replace (it'll look like `/assets/placeholders/fall-boots-ww.svg`) in `src/_data/products.json` or in a page file.
3. Replace it with your new path, e.g. `/assets/images/fall-boots.jpg`.
4. Update the matching `"alt"` text to actually describe your new photo — this matters for accessibility and for Google/Pinterest.

Every placeholder image in this project is an on-brand labeled box (not a random stock photo) specifically so it's obvious which ones you still need to swap.

---

## 6. HOW TO ADD A RECOMMENDATION (any product)

Open **`src/_data/products.json`**. This ONE file is where every product/recommendation on the entire site lives — Amazon finds, fashion, home, beauty, gifts, Archi pieces, all of it.

Copy an existing entry and change the details:

```json
{
  "id": "cozy-slippers",
  "title": "The Slippers I Now Own in Two Colors",
  "note": "A short, personal one-or-two sentence note in your own voice.",
  "image": "/assets/images/slippers.jpg",
  "alt": "Describe the photo for accessibility and SEO",
  "retailer": "Amazon",
  "price": "$32",
  "url": "https://www.amazon.com/your-real-link",
  "affiliate": true,
  "categories": ["amazon", "home", "currentFavorites"],
  "homeSections": ["whitFoundIt"],
  "featured": false,
  "dateAdded": "2026-10-01"
}
```

A few notes on the fields:
- **`id`** — a short, unique nickname for this item, lowercase with dashes. Nothing else needs to match it, but it's how you'll reference this item from an outfit page or a "Shop the Look" (see section 10).
- **`categories`** — controls which Shop page filter(s) it shows up under. Options: `amazon`, `fashion`, `home`, `beauty`, `gifts`, `archi`, `currentFavorites`. An item can have more than one.
- **`homeSections`** — which homepage section(s) it should appear in, if any. Options: `currentlyInto`, `whitFoundIt`, `atHome`, `beautyShelf`, `madeByMe`. Leave it as `[]` if you don't want it on the homepage.
- **`price`** — optional. Delete the line entirely if you'd rather not show one.
- Don't forget the comma between entries in the list, and don't leave a trailing comma after the very last item.

That's it — the item will now automatically show up everywhere it's supposed to (Shop page, the right homepage section, any filter) without touching any other file.

---

## 7. HOW TO ADD AN AMAZON LINK

An Amazon link is just a normal recommendation (section 6 above) where:
- `"retailer"` is `"Amazon"`
- `"categories"` includes `"amazon"`
- `"url"` is just the plain Amazon product link (like `https://www.amazon.com/dp/B0EXAMPLE`) — no need to add your tracking tag yourself, see the note below
- `"affiliate"` is `true` (see section 8)

**Your Amazon Associates tag is applied automatically.** Your tag is stored once in `src/_data/site.json` under `"affiliate": { "amazonTag": "..." }`. Every time the site builds, any product link pointing to amazon.com automatically gets your tag added to it — you never have to build the tracking link yourself, and you never have to touch old links again if your tag ever changes. Just paste the plain product URL into `products.json` and you're done.

A quick note on Amazon's rules: Amazon's Associates policy doesn't allow showing a fixed price for Amazon products on your site (since prices change constantly and a stale price can get your account flagged), so the `"price"` field is left out on Amazon items — the "Shop" button just sends people to Amazon to see the current price. This doesn't apply to non-Amazon retailers like Levi's or Sephora, where you can still list a price if you want.

---

## 8. HOW TO MARK A LINK AS AFFILIATE

Set `"affiliate": true` on that item in `products.json`. That one flag automatically:
- Adds a small "Affiliate Link" badge on the product photo
- Adds `rel="sponsored"` to the link (this is the tag Google and the FTC expect on paid/affiliate links)

If a link is NOT an affiliate link (like a straight link to your own Etsy shop), set `"affiliate": false` or leave the field out.

The site also has sitewide affiliate disclosure language in two places you should keep accurate:
- **`src/_data/site.json`** → `affiliateDisclosure.short` and `affiliateDisclosure.full` — this feeds the footer (on every page) and the banner at the top of the Shop page.
- If you ever join a new affiliate program (e.g., LTK, ShopStyle), update the `full` disclosure text to mention it.

---

## 9. HOW TO ADD AN OUTFIT

Outfits are just a content page (like `src/pages/style/baggy-levis.html`) tagged `"style"`. To add a new one:

1. Duplicate `src/pages/style/baggy-levis.html` and rename it, e.g. `src/pages/style/date-night-outfit.html`. The filename becomes the URL: this one would be `whitsworld.com/style/date-night-outfit/`.
2. Update the front matter at the top: `title`, `description`, `subtitle`, `heroImage`, `heroAlt`, `date`, `cardImage` (the photo shown on the Style hub page).
3. Keep `"tags": ["style"]` — that's what makes it automatically show up on the Style page (`/style/`). No separate list to update.
4. Update the `gallery` array with your own outfit photos.
5. Update or remove the `shopTheLookIds` list (see section 10) with the product IDs featured in this outfit.
6. Rewrite the body text further down in the file — the numbered "ways to wear it" sections, or just a normal paragraph if it's a single outfit.

Rebuild, and your new outfit page appears automatically on `/style/` with no extra step.

---

## 10. HOW TO CREATE A "SHOP THE LOOK" SECTION

Any content page can have one. In that page's front matter, add:

```json
"shopTheLookTitle": "Shop the Look",
"shopTheLookIds": ["baggy-levis-501", "gold-hoop-earrings", "fall-boots"]
```

Then, anywhere in the page's body where you want the section to appear, add this one line:

```
{{> shop-the-look}}
```

The IDs are the same `"id"` values from `products.json` (section 6). The build script automatically looks each one up and turns it into a full product card — image, title, note, price, and shop link — with the right affiliate styling already applied. You never re-type product details twice.

**This same trick works for any list of products anywhere.** Name a front matter field anything ending in `Ids` (like `"featuredIds"`) and the build script will automatically create a matching `featuredItems` list you can loop over in that page.

---

## 11. HOW TO CREATE A NEW COLLECTION/CONTENT PAGE

This is the general version of section 9, for anything that isn't an outfit — a home project, a beauty roundup, a seasonal favorites list, etc.

1. Decide which section it belongs to: `style`, `home`, or `beauty`. Create the file inside that folder, e.g. `src/pages/home/fall-favorites.html`.
2. Start with this front matter template:

```
---
{
  "title": "Fall Favorites | Whit's World",
  "description": "One sentence describing this page for Google and social previews.",
  "subtitle": "A short subtitle shown under the headline.",
  "heroImage": "/assets/images/fall-favorites-hero.jpg",
  "heroAlt": "Describe the hero photo",
  "date": "2026-10-01",
  "tags": ["home"],
  "cardImage": "/assets/images/fall-favorites-card.jpg",
  "cardAlt": "Describe the thumbnail photo",
  "shopTheLookTitle": "Shop This Post",
  "shopTheLookIds": ["id-one", "id-two", "id-three"]
}
---
```
3. Below the second `---`, write the actual page. The easiest approach is to copy the body of an existing page like `src/pages/home/wine-wall-project.html` (a longer project write-up) or `src/pages/home/amazon-kitchen-finds.html` (a quick list-style collection with no narrative) and edit the text.
4. Put `{{> gallery}}` wherever you want a photo gallery (make sure the page's front matter has a `"gallery"` array — see any existing page for the format).
5. Put `{{> shop-the-look}}` wherever you want the shop-the-look block.
6. The `"tags"` field is what makes it show up automatically on that section's hub page (`/style/`, `/home/`, or a future `/beauty/` listing) — nothing else to update.

The URL is always based on the file's path and name, with pretty folder-style URLs (`home/fall-favorites.html` becomes `/home/fall-favorites/`).

---

## 12. HOW TO ADD AN ARCHI PRODUCT

Archi products are recommendations too (section 6), just tagged differently:

```json
{
  "id": "archi-new-earrings",
  "title": "New Earring Style Name",
  "note": "A short note about this piece.",
  "image": "/assets/images/archi-new-earrings.jpg",
  "alt": "Describe the piece",
  "retailer": "Archi",
  "price": "$26",
  "url": "https://www.etsy.com/shop/shoparchi",
  "affiliate": false,
  "categories": ["archi", "fashion"],
  "homeSections": ["madeByMe"],
  "featured": true,
  "dateAdded": "2026-10-01"
}
```

Set `"affiliate": false` since it's your own shop, not a paid link. Including `"madeByMe"` in `homeSections` adds it to the homepage "Made By Me" section, and `"archi"` in `categories` adds it to the `/archi/` page and the Shop page's filters automatically.

---

## 13. HOW TO CHANGE THE NAVIGATION

Open **`src/_data/site.json`** and edit the `"nav"` list:

```json
"nav": [
  { "label": "Shop", "url": "/shop/" },
  { "label": "Style", "url": "/style/" },
  { "label": "Home", "url": "/home/" },
  { "label": "Beauty", "url": "/beauty/" },
  { "label": "Archi", "url": "/archi/" }
]
```

To add a new nav item (say, once you build out Travel), add a line like `{ "label": "Travel", "url": "/travel/" }`. It automatically appears in both the desktop menu and the mobile menu — they both pull from this same list. Keep it to 5–6 items max so the header doesn't get crowded.

---

## 14. HOW TO CHANGE COLORS

Open **`src/assets/css/styles.css`** and look at the very top of the file — section `1. VARIABLES`. Every color used anywhere on the site is defined once there:

```css
--color-cream:        #F8F2E9;   /* main background */
--color-ink:          #241C15;   /* main text color */
--color-caramel:      #A8632F;   /* accent color — links, tags, kickers */
--color-clay:         #C1774F;   /* secondary accent */
```

Change a value here and it updates everywhere on the site automatically — you never need to hunt through individual pages.

---

## 15. HOW TO CHANGE FONTS

Also at the top of **`src/assets/css/styles.css`**:

```css
--font-display: 'Fraunces', 'Iowan Old Style', 'Georgia', serif;   /* headlines */
--font-body: 'Work Sans', -apple-system, sans-serif;                /* body text */
--font-hand: 'Caveat', cursive;                                     /* handwritten accents */
```

To swap a font:
1. Pick a new font from [Google Fonts](https://fonts.google.com).
2. In **`src/_partials/head.html`**, update the Google Fonts `<link>` line near the bottom to load your new font instead of (or alongside) the current ones.
3. Update the matching `--font-display`, `--font-body`, or `--font-hand` variable above to the new font's name.

---

## 16. HOW TO ADD A DOMAIN LATER

Once you own a domain (like `whitsworld.com`):
1. In Cloudflare Pages, open your project → "Custom domains" → "Set up a custom domain."
2. Follow the prompts (if your domain is already on Cloudflare, this is close to instant; otherwise it'll ask you to update a couple of DNS records with whoever you bought the domain from).
3. Update `"url"` in `src/_data/site.json` (under `"brand"`) to your real domain. This is used to build canonical links, the sitemap, and social preview links — it's the one place that needs to know your real address.

---

## 17. HOW TO ADD A JOURNAL LATER

This site was built so a Journal/blog section can be added without restructuring anything:

1. Create a `src/pages/journal/` folder.
2. Add `src/pages/journal/index.html` as the Journal hub page — copy the structure of `src/pages/style/index.html`, but loop over `{{#each tagged.journal}}` instead of `{{#each tagged.style}}`.
3. Write individual entries the same way you'd write any content page (section 11), tagging each one `"tags": ["journal"]`.
4. Add `{ "label": "Journal", "url": "/journal/" }` to the nav in `site.json` (section 13) when you're ready to make it public.

Nothing else changes — the tag system and page templates already support this.

---

## 18. IF SOMETHING BREAKS

- **The build fails with a message about front matter / JSON:** you likely have a missing comma, an extra comma after the last item in a list, or a missing quote mark in a page's front matter or in `products.json`. The error message tells you which file. JSON is picky about commas — that's almost always it.
- **A product shows up blank or a page shows a "missing partial" comment:** double check the spelling of the `id` you referenced, or the partial name after `{{> }}`.
- **You want to undo everything:** since `build.js` never touches anything in `src/`, you can always delete the `dist/` folder and run `node build.js` again to regenerate it safely.
- **You're not sure what a file does:** every partial in `src/_partials/` and the top of `build.js` has a plain-English comment explaining its job.

When in doubt, hand this file and the project folder to an AI coding assistant and describe what you want in plain English ("add this Amazon link to my Home finds," "make a new outfit page with these three photos") — this document has everything it needs to do it correctly without restructuring your site.
