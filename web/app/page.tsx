import { getSupabaseServer } from "../utils/supabase";

export default async function Home() {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("profiles")
    .select("*");

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-900 text-red-400">
        <h1 className="text-2xl font-bold">Database Error ❌</h1>
        <p className="mt-2 text-sm bg-slate-800 p-4 rounded font-mono">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-900 text-slate-100">
      <h1 className="text-4xl font-bold tracking-tight">Dinner Club 🍽️</h1>
      <p className="mt-4 text-emerald-400 font-medium">
        Database Status: Connected
      </p>
    </div>
  );
}