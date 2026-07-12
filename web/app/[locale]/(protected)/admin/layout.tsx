// app/[locale]/(protected)/admin/layout.tsx

import { redirect } from "next/navigation";
import { getUserWithRole } from "@/utils/supabase/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getUserWithRole();

  if (!user) {
    redirect("/login");
  }

  if (role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
