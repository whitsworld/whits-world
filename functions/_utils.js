// Shared helpers for the /admin publishing tool.
// Nothing in here is a route (Cloudflare ignores files starting with "_").

export const REPO = "whitsworld/whits-world";
export const BRANCH = "main";

function textEncode(str) {
  return new TextEncoder().encode(str);
}

async function importKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    textEncode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signValue(secret, value) {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, textEncode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function makeSessionCookie(secret) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const sig = await signValue(secret, String(expires));
  const token = `${expires}.${sig}`;
  return `ww_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearSessionCookie() {
  return `ww_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function isAuthed(request, secret) {
  if (!secret) return false;
  const token = getCookie(request, "ww_admin");
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expiresStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expires = Number(expiresStr);
  if (!expires || expires < Date.now()) return false;
  const expectedSig = await signValue(secret, expiresStr);
  return timingSafeEqual(sig, expectedSig);
}

export function slugify(str) {
  return (
    String(str)
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}

export function page({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title} — Whit's World Admin</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #faf7f2;
    color: #2b2622;
    display: flex;
    justify-content: center;
    padding: 48px 20px;
  }
  .card {
    width: 100%;
    max-width: 520px;
    background: #fff;
    border-radius: 16px;
    padding: 36px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #8a8177; font-size: 14px; margin: 0 0 28px; }
  label { display:block; font-size: 13px; font-weight: 600; margin: 18px 0 6px; color:#5c554c;}
  input[type=text], input[type=password], input[type=url], select, textarea {
    width: 100%; padding: 11px 12px; border: 1px solid #ddd6cb; border-radius: 8px; font-size: 15px; font-family: inherit; background:#fffdfa;
  }
  textarea { resize: vertical; min-height: 60px; }
  input[type=file] { width: 100%; padding: 8px 0; }
  .row { display:flex; gap: 12px; }
  .row > div { flex:1; }
  .checks { display:flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 4px;}
  .checks label { display:flex; align-items:center; gap:6px; font-weight:400; font-size:14px; margin:0; color:#2b2622;}
  .checks input { width:auto; }
  button {
    margin-top: 28px; width: 100%; padding: 13px; border: none; border-radius: 8px;
    background: #2b2622; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
  }
  button:hover { background:#48413a; }
  .error { background:#fbe9e7; color:#9c3b2c; padding:10px 14px; border-radius:8px; font-size:14px; margin-bottom: 18px;}
  .success { background:#e9f3ea; color:#2f5d34; padding:14px 16px; border-radius:8px; font-size:14px; margin-bottom: 18px;}
  a { color:#2b2622; }
  .top { display:flex; justify-content: space-between; align-items:center; margin-bottom: 4px;}
  .logout { font-size:13px; color:#8a8177; text-decoration:none; }
  .hint { font-size:12px; color:#8a8177; margin-top:4px; }
</style>
</head>
<body>
<div class="card">
${body}
</div>
</body>
</html>`;
}

const GH_API = "https://api.github.com";

async function ghRequest(env, path, options = {}) {
  return fetch(`${GH_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "whits-world-admin",
      Accept: "application/vnd.github+json",
      ...(options.headers || {}),
    },
  });
}

export async function githubGetFile(env, filePath) {
  const res = await ghRequest(env, `/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${filePath} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
  return { content, sha: data.sha };
}

export async function githubPutFile(env, filePath, contentStr, message, sha) {
  const body = {
    message,
    branch: BRANCH,
    content: btoa(unescape(encodeURIComponent(contentStr))),
  };
  if (sha) body.sha = sha;
  const res = await ghRequest(env, `/repos/${REPO}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${filePath} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function githubPutBinaryFile(env, filePath, base64Content, message) {
  const body = { message, branch: BRANCH, content: base64Content };
  const res = await ghRequest(env, `/repos/${REPO}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${filePath} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
