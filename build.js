#!/usr/bin/env node
/**
 * ============================================================================
 *  WHIT'S WORLD — BUILD SCRIPT
 * ============================================================================
 *
 *  This is the ONLY "engine" file in this project. It reads plain HTML/JSON
 *  files from /src, stitches them together, and writes finished pages into
 *  /dist. It uses ZERO external packages — only Node's built-in "fs" and
 *  "path" modules. There is nothing to `npm install`, nothing to update,
 *  and nothing that can break from a dependency going away.
 *
 *  You should almost never need to edit this file. If you're a human or an
 *  AI assistant looking for "where do I add content" — this is NOT it.
 *  Go to HOW TO UPDATE WHITS WORLD.md instead.
 *
 *  WHAT THIS SCRIPT DOES, IN PLAIN ENGLISH:
 *    1. Reads site-wide settings from src/_data/site.json
 *    2. Reads every product/recommendation from src/_data/products.json
 *    3. Groups those products into handy collections (by category, by
 *       homepage section, etc.) so templates can loop over them
 *    4. Reads reusable snippets ("partials") from src/_partials/
 *       (header, footer, product card, shop-the-look, etc.)
 *    5. Reads every page from src/pages/, fills in the {{ tokens }},
 *       wraps it in the site layout, and writes the finished HTML to /dist
 *    6. Copies /src/assets (css/js) and /src/static (favicon, robots.txt,
 *       etc.) into /dist untouched
 *    7. Builds a sitemap.xml from the pages it just built
 *
 *  HOW TO RUN IT:
 *    node build.js            -> builds the site once into /dist
 *    node build.js --watch    -> builds, then rebuilds automatically
 *                                 whenever a file in /src changes
 *
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const DATA_DIR = path.join(SRC, '_data');
const PARTIALS_DIR = path.join(SRC, '_partials');
const PAGES_DIR = path.join(SRC, 'pages');
const ASSETS_DIR = path.join(SRC, 'assets');
const STATIC_DIR = path.join(SRC, 'static');

// ----------------------------------------------------------------------------
// Small file-system helpers
// ----------------------------------------------------------------------------

function walk(dir, extFilter) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, extFilter));
    } else if (!extFilter || entry.name.endsWith(extFilter)) {
      results.push(full);
    }
  }
  return results;
}

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
    }
  }
}

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

// ----------------------------------------------------------------------------
// Front matter: every page starts with a fenced JSON block, e.g.
//
//   ---
//   {
//     "title": "Shop | Whit's World",
//     "description": "A few things I'm loving right now."
//   }
//   ---
//   <p>The rest of the page goes here.</p>
//
// It's just JSON, so quotes go around every key, and there's no trailing
// comma after the last item in a list.
// ----------------------------------------------------------------------------

function extractFrontMatter(raw, filePathForErrors) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { data: {}, body: raw };
  let data = {};
  try {
    data = JSON.parse(match[1]);
  } catch (err) {
    console.error(`\n[whits-world build] Could not read the front matter in:\n  ${filePathForErrors}`);
    console.error(`  ${err.message}`);
    console.error(`  Double check for a missing comma or quote mark.\n`);
    process.exitCode = 1;
  }
  return { data, body: raw.slice(match[0].length) };
}

// ----------------------------------------------------------------------------
// TEMPLATE ENGINE
// Supports:
//   {{ path.to.value }}      -> outputs the value, HTML-escaped
//   {{{ path.to.value }}}    -> outputs the value WITHOUT escaping (raw HTML)
//   {{> partialName }}       -> inserts a reusable snippet from src/_partials
//   {{#each path }} ... {{/each}}     -> loops over an array
//   {{#if path }} ... {{else}} ... {{/if}}   -> conditional
//   {{#unless path }} ... {{/unless}}        -> inverted conditional
//
// Inside an #each block, the current item's own fields are available
// directly (e.g. {{title}}), plus {{@index}}, {{@first}}, {{@last}}.
// Everything from the surrounding page (like {{site.brand.name}}) still
// works inside partials and loops too.
// ----------------------------------------------------------------------------

const TAG_RE = /\{\{\{([\s\S]+?)\}\}\}|\{\{([\s\S]+?)\}\}/g;

function tokenize(str) {
  const tokens = [];
  let lastIndex = 0;
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(str))) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', value: str.slice(lastIndex, m.index) });
    }
    if (m[1] !== undefined) {
      tokens.push({ type: 'tag', kind: 'raw', arg: m[1].trim() });
    } else {
      const content = m[2].trim();
      if (content.startsWith('#each ')) {
        tokens.push({ type: 'tag', kind: 'each-open', arg: content.slice(6).trim() });
      } else if (content === '/each') {
        tokens.push({ type: 'tag', kind: 'each-close' });
      } else if (content.startsWith('#if ')) {
        tokens.push({ type: 'tag', kind: 'if-open', arg: content.slice(4).trim() });
      } else if (content === '/if') {
        tokens.push({ type: 'tag', kind: 'if-close' });
      } else if (content.startsWith('#unless ')) {
        tokens.push({ type: 'tag', kind: 'unless-open', arg: content.slice(8).trim() });
      } else if (content === '/unless') {
        tokens.push({ type: 'tag', kind: 'unless-close' });
      } else if (content === 'else') {
        tokens.push({ type: 'tag', kind: 'else' });
      } else if (content.startsWith('> ')) {
        tokens.push({ type: 'tag', kind: 'partial', arg: content.slice(2).trim() });
      } else {
        tokens.push({ type: 'tag', kind: 'var', arg: content });
      }
    }
    lastIndex = TAG_RE.lastIndex;
  }
  if (lastIndex < str.length) tokens.push({ type: 'text', value: str.slice(lastIndex) });
  return tokens;
}

function parseTokens(tokens) {
  let i = 0;

  function parseUntil(stopKinds) {
    const nodes = [];
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.type === 'text') {
        nodes.push({ type: 'text', value: t.value });
        i++;
        continue;
      }
      if (stopKinds && stopKinds.has(t.kind)) return nodes;
      switch (t.kind) {
        case 'var':
          nodes.push({ type: 'var', path: t.arg, raw: false });
          i++;
          break;
        case 'raw':
          nodes.push({ type: 'var', path: t.arg, raw: true });
          i++;
          break;
        case 'partial':
          nodes.push({ type: 'partial', name: t.arg });
          i++;
          break;
        case 'each-open': {
          const path_ = t.arg;
          i++;
          const children = parseUntil(new Set(['each-close']));
          if (tokens[i] && tokens[i].kind === 'each-close') i++;
          nodes.push({ type: 'each', path: path_, children });
          break;
        }
        case 'if-open': {
          const path_ = t.arg;
          i++;
          const consequent = parseUntil(new Set(['else', 'if-close']));
          let alternate = [];
          if (tokens[i] && tokens[i].kind === 'else') {
            i++;
            alternate = parseUntil(new Set(['if-close']));
          }
          if (tokens[i] && tokens[i].kind === 'if-close') i++;
          nodes.push({ type: 'if', path: path_, consequent, alternate });
          break;
        }
        case 'unless-open': {
          const path_ = t.arg;
          i++;
          const consequent = parseUntil(new Set(['unless-close']));
          if (tokens[i] && tokens[i].kind === 'unless-close') i++;
          nodes.push({ type: 'unless', path: path_, consequent });
          break;
        }
        default:
          i++; // stray/unmatched closing tag — ignore
      }
    }
    return nodes;
  }

  return parseUntil(null);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPath(obj, dottedPath) {
  const parts = dottedPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function resolve(dottedPath, stack) {
  for (let i = stack.length - 1; i >= 0; i--) {
    const val = getPath(stack[i], dottedPath);
    if (val !== undefined) return val;
  }
  return undefined;
}

function isTruthy(val) {
  if (Array.isArray(val)) return val.length > 0;
  return Boolean(val);
}

const partialCache = {}; // name -> parsed node tree

function loadPartial(name) {
  if (partialCache[name]) return partialCache[name];
  const file = path.join(PARTIALS_DIR, name.endsWith('.html') ? name : `${name}.html`);
  if (!fs.existsSync(file)) {
    console.warn(`[whits-world build] Missing partial: ${name} (looked in src/_partials/)`);
    partialCache[name] = [];
    return [];
  }
  const raw = fs.readFileSync(file, 'utf8');
  const nodes = parseTokens(tokenize(raw));
  partialCache[name] = nodes;
  return nodes;
}

function renderNodes(nodes, stack) {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      out += node.value;
    } else if (node.type === 'var') {
      const val = resolve(node.path, stack);
      const str = val === undefined || val === null ? '' : String(val);
      out += node.raw ? str : escapeHtml(str);
    } else if (node.type === 'partial') {
      const nodesForPartial = loadPartial(node.name);
      out += renderNodes(nodesForPartial, stack);
    } else if (node.type === 'each') {
      const arr = resolve(node.path, stack);
      if (Array.isArray(arr)) {
        arr.forEach((item, idx) => {
          const frame =
            item && typeof item === 'object' && !Array.isArray(item)
              ? { ...item }
              : { this: item };
          frame['@index'] = idx;
          frame['@first'] = idx === 0;
          frame['@last'] = idx === arr.length - 1;
          out += renderNodes(node.children, [...stack, frame]);
        });
      }
    } else if (node.type === 'if') {
      const val = resolve(node.path, stack);
      out += renderNodes(isTruthy(val) ? node.consequent : node.alternate, stack);
    } else if (node.type === 'unless') {
      const val = resolve(node.path, stack);
      out += !isTruthy(val) ? renderNodes(node.consequent, stack) : '';
    }
  }
  return out;
}

function render(templateStr, context) {
  const nodes = parseTokens(tokenize(templateStr));
  return renderNodes(nodes, [context]);
}

// ----------------------------------------------------------------------------
// Load data
// ----------------------------------------------------------------------------

function loadData() {
  const site = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'site.json'), 'utf8'));
  const products = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf8'));

  // Give every product a ready-to-use space-separated category string for
  // data-attributes (used by the Shop page's filter buttons in main.js).
  products.forEach((p) => {
    p.categoriesAttr = (p.categories || []).join(' ');
  });

  const productsById = {};
  products.forEach((p) => {
    productsById[p.id] = p;
  });

  const shopCategories = ['amazon', 'fashion', 'home', 'beauty', 'gifts', 'archi', 'currentFavorites'];
  const collections = { all: products };
  shopCategories.forEach((cat) => {
    collections[cat] = products.filter((p) => (p.categories || []).includes(cat));
  });

  // A couple of handy cross-filters (category + current favorite) used by
  // the Beauty hub page.
  collections.beautyCurrentFavorites = products.filter(
    (p) => (p.categories || []).includes('beauty') && (p.categories || []).includes('currentFavorites')
  );

  const homeSectionKeys = ['currentlyInto', 'whitFoundIt', 'atHome', 'beautyShelf', 'madeByMe'];
  const sections = {};
  homeSectionKeys.forEach((key) => {
    sections[key] = products.filter((p) => (p.homeSections || []).includes(key));
  });

  // "The Latest" — most recently added items across the whole site.
  const latest = [...products].sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : -1)).slice(0, 6);

  return { site, products, productsById, collections, sections, latest };
}

// Any front matter field named "somethingIds" (an array of product IDs)
// automatically becomes "somethingItems" (the full product objects), so a
// page or a Shop-the-Look block only ever needs a short list of IDs.
function resolveIdFields(data, productsById) {
  const resolved = { ...data };
  Object.keys(data).forEach((key) => {
    if (key.endsWith('Ids') && Array.isArray(data[key])) {
      const itemsKey = key.slice(0, -3) + 'Items';
      resolved[itemsKey] = data[key]
        .map((id) => {
          const item = productsById[id];
          if (!item) {
            console.warn(`[whits-world build] Product id "${id}" (from "${key}") was not found in products.json`);
          }
          return item;
        })
        .filter(Boolean);
    }
  });
  return resolved;
}

// ----------------------------------------------------------------------------
// Build
// ----------------------------------------------------------------------------

function outputPathFor(pageFile) {
  const rel = path.relative(PAGES_DIR, pageFile); // e.g. "style/sample-outfit.html" or "index.html"
  const parsed = path.parse(rel);
  if (parsed.name === 'index') {
    return path.join(DIST, parsed.dir, 'index.html');
  }
  // 404.html stays flat at the site root (that's the file Cloudflare Pages,
  // Netlify, etc. look for) instead of becoming a pretty /404/ folder.
  if (parsed.name === '404' && parsed.dir === '') {
    return path.join(DIST, '404.html');
  }
  return path.join(DIST, parsed.dir, parsed.name, 'index.html');
}

function routeFor(distFile) {
  let rel = '/' + path.relative(DIST, distFile).split(path.sep).join('/');
  rel = rel.replace(/index\.html$/, '');
  if (rel === '') rel = '/';
  return rel;
}

function build() {
  const startedAt = Date.now();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  Object.keys(partialCache).forEach((k) => delete partialCache[k]); // clear cache for --watch

  const { site, products, productsById, collections, sections, latest } = loadData();
  const pageFiles = walk(PAGES_DIR, '.html');

  // ---- PASS 1: read every page's front matter + figure out its route, ----
  // ---- WITHOUT rendering yet. This lets hub pages (like /style/) list ----
  // ---- every tagged content page automatically, even ones added later. --
  const parsedPages = pageFiles.map((pageFile) => {
    const raw = fs.readFileSync(pageFile, 'utf8');
    const { data: rawFrontMatter, body } = extractFrontMatter(raw, path.relative(ROOT, pageFile));
    const distFile = outputPathFor(pageFile);
    const route = routeFor(distFile);
    return { pageFile, distFile, route, rawFrontMatter, body };
  });

  // Build "tag collections" — e.g. tagged.style is every page whose front
  // matter has "tags": [...,"style",...], newest first. A hub page (Style,
  // Home, Beauty) loops over tagged.<its own name> to list its content
  // pages, so a brand new page shows up automatically — no separate index
  // to maintain.
  const tagged = {};
  parsedPages.forEach(({ rawFrontMatter, route }) => {
    const tags = rawFrontMatter.tags || [];
    if (!tags.length) return;
    const cardEntry = {
      title: rawFrontMatter.title,
      cardTitle: rawFrontMatter.cardTitle || rawFrontMatter.title,
      excerpt: rawFrontMatter.excerpt || rawFrontMatter.description || '',
      cardImage: rawFrontMatter.cardImage || rawFrontMatter.heroImage || '',
      cardAlt: rawFrontMatter.cardAlt || rawFrontMatter.heroAlt || '',
      date: rawFrontMatter.date || '',
      url: route,
    };
    tags.forEach((tag) => {
      if (!tagged[tag]) tagged[tag] = [];
      tagged[tag].push(cardEntry);
    });
  });
  Object.keys(tagged).forEach((tag) => {
    tagged[tag].sort((a, b) => (a.date < b.date ? 1 : -1));
  });

  const builtPages = [];

  // ---- PASS 2: actually render every page now that `tagged` is complete --
  for (const { pageFile, distFile, route, rawFrontMatter, body } of parsedPages) {
    const pageData = resolveIdFields(rawFrontMatter, productsById);
    pageData.url = route;

    // A page is "active" in the nav if its route starts with that nav
    // item's url (so /style/some-post/ still highlights the STYLE tab).
    const navItems = site.nav.map((item) => ({
      ...item,
      active: item.url === '/' ? route === '/' : route.indexOf(item.url) === 0,
    }));

    const baseContext = {
      site,
      page: pageData,
      products,
      collections,
      sections,
      latest,
      navItems,
      tagged,
    };

    const renderedBody = render(body, baseContext);

    const layoutContext = { ...baseContext, content: renderedBody };
    const layoutSrc = fs.readFileSync(path.join(PARTIALS_DIR, 'layout.html'), 'utf8');
    const finalHtml = render(layoutSrc, layoutContext);

    ensureDirFor(distFile);
    fs.writeFileSync(distFile, finalHtml);

    if (pageData.sitemap !== false) {
      builtPages.push({
        route,
        lastmod: pageData.date || pageData.dateUpdated || null,
      });
    }
  }

  // Copy assets & static files as-is
  copyRecursive(ASSETS_DIR, path.join(DIST, 'assets'));
  copyRecursive(STATIC_DIR, DIST);

  // Sitemap
  const siteUrl = (site.brand && site.brand.url) || '';
  const urlEntries = builtPages
    .map((p) => {
      const loc = siteUrl ? siteUrl.replace(/\/$/, '') + p.route : p.route;
      const lastmodTag = p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`;
    })
    .join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);

  const ms = Date.now() - startedAt;
  console.log(`[whits-world build] Built ${builtPages.length} pages into /dist in ${ms}ms`);
}

build();

// ----------------------------------------------------------------------------
// Optional watch mode: `node build.js --watch`
// ----------------------------------------------------------------------------

if (process.argv.includes('--watch')) {
  console.log('[whits-world build] Watching src/ for changes... (Ctrl+C to stop)');
  let pending = false;
  const rebuild = () => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      try {
        build();
      } catch (err) {
        console.error('[whits-world build] Build failed:', err.message);
      }
    }, 150);
  };
  try {
    // Recursive watching works on macOS and Windows. On Linux it isn't
    // supported and throws, so we fall back to watching each folder.
    fs.watch(SRC, { recursive: true }, rebuild);
  } catch (err) {
    function collectDirs(dir) {
      let dirs = [dir];
      if (!fs.existsSync(dir)) return [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) dirs = dirs.concat(collectDirs(path.join(dir, entry.name)));
      }
      return dirs;
    }
    const dirs = collectDirs(SRC);
    [...new Set(dirs)].forEach((dir) => {
      try {
        fs.watch(dir, rebuild);
      } catch (e) {
        /* ignore folders that don't exist yet */
      }
    });
  }
}
