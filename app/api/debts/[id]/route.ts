import { authenticated, apiData, apiError, databaseError, validId } from "@/lib/debt-api";
import { validateDebt, type Debt } from "@/lib/debts";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await authenticated(); if (auth.response) return auth.response;
    const { id } = await context.params; if (!validId(id)) return apiError("ID catatan tidak valid.", 400);
    let body: unknown; try {body = await request.json();} catch {return apiError("Format JSON tidak valid.", 400);}
    if (!body || typeof body !== "object" || Array.isArray(body)) return apiError("Data pembaruan tidak valid.", 400);
    const input = body as Record<string, unknown>;
    const allowed = ["type", "counterpart_name", "amount", "note", "due_date", "settled"];
    if (!Object.keys(input).length || Object.keys(input).some(key => !allowed.includes(key))) return apiError("Kolom pembaruan tidak valid.", 400);
    if ("settled" in input && typeof input.settled !== "boolean") return apiError("Status lunas tidak valid.", 400);
    const existing = await auth.supabase.from("debts").select("*").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
    if (existing.error) return databaseError(existing.error.code);
    if (!existing.data) return apiError("Catatan tidak ditemukan.", 404);
    const result = validateDebt({ ...(existing.data as Debt), ...input });
    if ("error" in result) return apiError(result.error, 400);
    const update = { ...result.data, ...("settled" in input ? { settled_at: input.settled ? new Date().toISOString() : null } : {}) };
    const { data, error } = await auth.supabase.from("debts").update(update).eq("id", id).eq("user_id", auth.user.id).select().maybeSingle();
    return error ? databaseError(error.code) : data ? apiData(data) : apiError("Catatan tidak ditemukan.", 404);
  } catch { return apiError("Koneksi bermasalah. Coba lagi sebentar.", 503); }
}
export async function DELETE(_request: Request, context: Context) {
  try {
    const auth = await authenticated(); if (auth.response) return auth.response;
    const { id } = await context.params; if (!validId(id)) return apiError("ID catatan tidak valid.", 400);
    const { data, error } = await auth.supabase.from("debts").delete().eq("id", id).eq("user_id", auth.user.id).select("id").maybeSingle();
    return error ? databaseError(error.code) : data ? apiData({ id }) : apiError("Catatan tidak ditemukan.", 404);
  } catch { return apiError("Koneksi bermasalah. Coba lagi sebentar.", 503); }
}
