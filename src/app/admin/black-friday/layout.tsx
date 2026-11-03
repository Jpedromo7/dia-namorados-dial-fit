import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentBlackFridayStaff } from "@/lib/black-friday-auth";

export const dynamic = "force-dynamic";

export default async function BlackFridayAdminLayout({ children }: { children: ReactNode }) {
  const staff = await getCurrentBlackFridayStaff();
  if (!staff) redirect("/admin/login");
  return children;
}
