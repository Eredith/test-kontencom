export type DebtType = "owed_to_me" | "i_owe";
export interface Debt {
  id: string;
  user_id: string;
  type: DebtType;
  counterpart_name: string;
  amount: number;
  note: string | null;
  due_date: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}
export type DebtInput = Pick<Debt, "type" | "counterpart_name" | "amount" | "note" | "due_date">;
const rupiahNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
export const rupiah = (value: number) => `${value < 0 ? "-" : ""}Rp ${rupiahNumber.format(Math.abs(value))}`;
export function validateDebt(value: unknown): { data: DebtInput } | { error: string } {
  if (!value || typeof value !== "object") return { error: "Data catatan tidak valid." };
  const body = value as Record<string, unknown>;
  if (body.type !== "owed_to_me" && body.type !== "i_owe") return { error: "Pilih tipe kasbon yang valid." };
  if (typeof body.counterpart_name !== "string" || !body.counterpart_name.trim() || body.counterpart_name.trim().length > 100) return { error: "Nama wajib diisi, maksimal 100 karakter." };
  if (typeof body.amount !== "number" || !Number.isSafeInteger(body.amount) || body.amount <= 0 || body.amount > 1_000_000_000_000) return { error: "Jumlah harus Rupiah utuh, lebih dari 0 dan maksimal 1 triliun." };
  if (body.note != null && (typeof body.note !== "string" || body.note.length > 200)) return { error: "Catatan maksimal 200 karakter." };
  if (body.due_date != null && (typeof body.due_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date) || Number.isNaN(Date.parse(body.due_date)) || new Date(body.due_date).toISOString().slice(0, 10) !== body.due_date)) return { error: "Tanggal tidak valid." };
  return { data: { type: body.type, counterpart_name: body.counterpart_name.trim(), amount: body.amount, note: typeof body.note === "string" ? body.note.trim() || null : null, due_date: typeof body.due_date === "string" ? body.due_date : null } };
}
