import { isAuthed, slugify, githubGetFile, githubPutFile, githubPutBinaryFile } from "../_utils.js";

export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env.ADMIN_PASSWORD))) {
    return Response.redirect(new URL("/admin", request.url).toString(), 302);
  }
  if (!env.GITHUB_TOKEN) {
    return redirectWithError(request, "The GITHUB_TOKEN environment variable hasn't been set in Cloudflare Pages yet.");
  }

  try {
    const form = await request.formData();
    const title = (form.get("title") || "").toString().trim();
    const note = (form.get("note") || "").toString().trim();
    const retailer = (form.get("retailer") || "Other").toString().trim();
    let price = (form.get("price") || "").toString().trim();
    const productUrl = (form.get("url") || "").toString().trim();
    const featured = form.get("featured") === "1";
    const categories = form.getAll("categories").map(String);
    const photo = form.get("photo");

    if (!title || !productUrl || !photo || typeof photo === "string" || !photo.size) {
      return redirectWithError(request, "Title, photo, and link are all required.");
    }

    const isAmazon = retailer.toLowerCase() === "amazon";
    if (isAmazon) {
      price = ""; // Amazon Associates policy: don't display a static price
      if (!categories.includes("amazon")) categories.push("amazon");
    }

    const stamp = Date.now().toString(36);
    const slug = slugify(title);
    const id = `${slug}-${stamp}`;

    // 1. Upload the photo to the repo
    const rawExt = (photo.name && photo.name.includes(".")) ? photo.name.split(".").pop() : "jpg";
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const fileName = `${slug}-${stamp}.${ext}`;
    const imagePath = `src/assets/images/uploads/${fileName}`;
    const bytes = new Uint8Array(await photo.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    await githubPutBinaryFile(env, imagePath, base64, `Admin: add photo for "${title}"`);

    // 2. Append the new product to products.json
    const existing = await githubGetFile(env, "src/_data/products.json");
    const products = existing ? JSON.parse(existing.content) : [];
    const newProduct = {
      id,
      title,
      note: note || undefined,
      image: `/assets/images/uploads/${fileName}`,
      alt: title,
      retailer,
      price: price || undefined,
      url: productUrl,
      affiliate: isAmazon || undefined,
      categories,
      featured: featured || undefined,
      dateAdded: new Date().toISOString().slice(0, 10),
    };
    Object.keys(newProduct).forEach((k) => newProduct[k] === undefined && delete newProduct[k]);
    products.push(newProduct);

    await githubPutFile(
      env,
      "src/_data/products.json",
      JSON.stringify(products, null, 2) + "\n",
      `Admin: add "${title}"`,
      existing ? existing.sha : undefined
    );

    return Response.redirect(new URL("/admin/dashboard?posted=1", request.url).toString(), 302);
  } catch (err) {
    return redirectWithError(request, "Something went wrong publishing: " + (err && err.message ? err.message : String(err)));
  }
}

function redirectWithError(request, message) {
  const dest = new URL("/admin/dashboard", request.url);
  dest.searchParams.set("error", message);
  return Response.redirect(dest.toString(), 302);
}
