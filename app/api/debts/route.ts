import { authenticated, apiData, apiError, databaseError } from "@/lib/debt-api";
import { validateDebt } from "@/lib/debts";

export async function GET(request: Request) {
  try {
    const auth = await authenticated(); if (auth.response) return auth.response;
    const params = new URL(request.url).searchParams;
    const status = params.get("status"); const type = params.get("type");
    if (status && !["all", "settled", "unsettled"].includes(status)) return apiError("Filter status tidak valid.", 400);
    if (type && !["all", "owed_to_me", "i_owe"].includes(type)) return apiError("Filter tipe tidak valid.", 400);
    let query = auth.supabase.from("debts").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false });
    if (status === "settled") query = query.not("settled_at", "is", null);
    if (status === "unsettled") query = query.is("settled_at", null);
    if (type && type !== "all") query = query.eq("type", type);
    const { data, error } = await query;
    return error ? databaseError(error.code) : apiData(data);
  } catch { return apiError("Koneksi bermasalah. Coba lagi sebentar.", 503); }
}
export async function POST(request: Request) {
  try {
    const auth = await authenticated(); if (auth.response) return auth.response;
    let body: unknown; try { body = await request.json(); } catch { return apiError("Format JSON tidak valid.", 400); }
    const result = validateDebt(body); if ("error" in result) return apiError(result.error, 400);
    const { data, error } = await auth.supabase.from("debts").insert({ ...result.data, user_id: auth.user.id }).select().single();
    return error ? databaseError(error.code) : apiData(data, 201);
  } catch { return apiError("Koneksi bermasalah. Coba lagi sebentar.", 503); }
}
