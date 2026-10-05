import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import Dashboard from "@/components/dashboard";
export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return <Dashboard email={data.user.email ?? ""} />;
}
