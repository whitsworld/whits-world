import { page, isAuthed } from "../_utils.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env.ADMIN_PASSWORD))) {
    return Response.redirect(new URL("/admin", request.url).toString(), 302);
  }
  const url = new URL(request.url);
  const success = url.searchParams.get("posted");
  const errorRaw = url.searchParams.get("error");
  const error = errorRaw ? decodeURIComponent(errorRaw) : null;

  return new Response(
    page({
      title: "Add a find",
      body: `
      <div class="top">
        <h1>Add a new find</h1>
        <a class="logout" href="/admin/logout">Log out</a>
      </div>
      <p class="sub">Fill this in and hit publish — it'll be live on the site in about a minute.</p>
      ${success ? `<div class="success">Published! <a href="/shop/" target="_blank">View the Shop page →</a></div>` : ""}
      ${error ? `<div class="error">${error}</div>` : ""}
      <form method="POST" action="/admin/publish" enctype="multipart/form-data">
        <label for="title">Title</label>
        <input type="text" id="title" name="title" required placeholder="The $14 Ice Roller I Use Every Morning">

        <label for="photo">Photo</label>
        <input type="file" id="photo" name="photo" accept="image/*" required>

        <label for="note">Short note (optional)</label>
        <textarea id="note" name="note" placeholder="A sentence or two about why you love it"></textarea>

        <div class="row">
          <div>
            <label for="retailer">Retailer</label>
            <select id="retailer" name="retailer">
              <option>Amazon</option>
              <option>Etsy</option>
              <option>Target</option>
              <option>Nordstrom</option>
              <option>Sephora</option>
              <option>Ulta</option>
              <option>Levi's</option>
              <option>Archi</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label for="price">Price (optional)</label>
            <input type="text" id="price" name="price" placeholder="$14">
            <p class="hint">Left off automatically for Amazon — prices there change too fast to list accurately.</p>
          </div>
        </div>

        <label for="url">Link (the plain product URL — your Amazon tag is added automatically)</label>
        <input type="url" id="url" name="url" required placeholder="https://www.amazon.com/dp/...">

        <label>Where should this show up? (it always shows on the main Shop page too)</label>
        <div class="checks">
          <label><input type="checkbox" name="categories" value="amazon"> Amazon</label>
          <label><input type="checkbox" name="categories" value="fashion"> Fashion</label>
          <label><input type="checkbox" name="categories" value="home"> Home</label>
          <label><input type="checkbox" name="categories" value="beauty"> Beauty</label>
          <label><input type="checkbox" name="categories" value="archi"> Archi</label>
          <label><input type="checkbox" name="categories" value="gifts"> Gifts</label>
          <label><input type="checkbox" name="categories" value="currentFavorites"> Current Favorites</label>
        </div>

        <label style="display:flex; align-items:center; gap:8px; font-weight:400;">
          <input type="checkbox" name="featured" value="1" style="width:auto;"> Feature this (larger placement where featured items show)
        </label>

        <button type="submit">Publish</button>
      </form>
      `,
    }),
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
