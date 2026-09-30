import { clearSessionCookie } from "../_utils.js";

export async function onRequestGet({ request }) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/admin",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
