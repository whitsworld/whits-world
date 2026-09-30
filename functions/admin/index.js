import { page, isAuthed, makeSessionCookie } from "../_utils.js";

export async function onRequestGet({ request, env }) {
  if (await isAuthed(request, env.ADMIN_PASSWORD)) {
    return Response.redirect(new URL("/admin/dashboard", request.url).toString(), 302);
  }
  return new Response(loginForm(), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) {
    return new Response(
      page({
        title: "Setup needed",
        body: `<h1>Almost there</h1><p class="sub">The ADMIN_PASSWORD environment variable hasn't been set in Cloudflare Pages yet.</p>`,
      }),
      { status: 500, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }
  const form = await request.formData();
  const password = (form.get("password") || "").toString();
  if (password !== env.ADMIN_PASSWORD) {
    return new Response(loginForm("That password isn't right — try again."), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  const cookie = await makeSessionCookie(env.ADMIN_PASSWORD);
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/admin/dashboard",
      "Set-Cookie": cookie,
    },
  });
}

function loginForm(error) {
  return page({
    title: "Log in",
    body: `
    <h1>Whit's World</h1>
    <p class="sub">Admin — post a new find</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/admin">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required autofocus>
      <button type="submit">Log in</button>
    </form>
    `,
  });
}
