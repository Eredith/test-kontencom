import Login from "@/components/login";

const messages: Record<string, string> = {
  invalid: "Periksa alamat email dan kata sandi kamu.",
  failed: "Login belum berhasil. Periksa kredensial atau konfirmasi email kamu.",
  confirm: "Akun berhasil dibuat. Cek email untuk konfirmasi, lalu masuk.",
  connection: "Koneksi bermasalah. Coba lagi sebentar, ya.",
};
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const code = typeof params.notice === "string" ? params.notice : "";
  return <Login initialMessage={messages[code] ?? ""} />;
}
