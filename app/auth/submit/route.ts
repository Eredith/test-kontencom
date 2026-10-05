import { createClient } from "@/lib/server";

function destination(path: string) {
  // Relative, fixed destinations: never reflect submitted fields into URLs.
  return new Response(null, { status: 303, headers: { Location: path, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}

export async function POST(request: Request) {
  // Native form fallback when client JavaScript is unavailable.
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Asal permintaan tidak diizinkan." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const form = await request.formData();
    const rawEmail = form.get("email");
    const password = form.get("password");
    const mode = form.get("mode");
    if (typeof rawEmail !== "string" || typeof password !== "string" || (mode !== "signup" && mode !== "login")) return destination("/login?notice=invalid");
    const email = rawEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < (mode === "signup" ? 8 : 1) || password.length > 128) return destination("/login?notice=invalid");
    const supabase = await createClient();
    const result = mode === "signup" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return destination("/login?notice=failed");
    return destination(result.data.session ? "/" : "/login?notice=confirm");
  } catch { return destination("/login?notice=connection"); }
}
