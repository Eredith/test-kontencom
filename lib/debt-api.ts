import "server-only";
import { createClient } from "@/lib/server";

export const apiError = (error: string, status: number) => Response.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
export const apiData = (data: unknown, status = 200) => Response.json({ data }, { status, headers: { "Cache-Control": "private, no-store" } });
export async function authenticated() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { response: apiError("Silakan masuk terlebih dahulu.", 401) };
  return { supabase, user: data.user };
}
export function databaseError(code: string) {
  return code === "42P01" || code === "PGRST205" ? apiError("Tabel kasbon belum tersedia. Jalankan migrasi database terlebih dahulu.", 503) : code === "42501" ? apiError("Kamu tidak memiliki akses ke catatan ini.", 403) : apiError("Catatan belum bisa diproses. Coba lagi sebentar.", 500);
}
export const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
