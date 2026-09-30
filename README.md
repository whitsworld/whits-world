# Whit's World

A personal, curated lifestyle site — built as a lightweight static site with **zero external dependencies**. No framework, no database, no CMS, nothing to `npm install`.

**Start here:** [`HOW TO UPDATE WHITS WORLD.md`](./HOW%20TO%20UPDATE%20WHITS%20WORLD.md) — a plain-English guide to everything from adding a product to changing the site's colors.

## Quick start

```
node build.js     # builds the site from /src into /dist
node serve.js     # previews it at http://localhost:8080
```

Requires only [Node.js](https://nodejs.org) — no `npm install` needed.

## Deploying

Push this repo to GitHub, connect it to [Cloudflare Pages](https://pages.cloudflare.com), and set:
- **Build command:** `node build.js`
- **Output directory:** `dist`

See the full how-to guide for details, including adding a custom domain later.
