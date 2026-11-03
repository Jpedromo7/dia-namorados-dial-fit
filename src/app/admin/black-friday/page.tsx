import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BlackFridayAdmin } from "@/components/black-friday/BlackFridayAdmin";
import { getCurrentBlackFridayStaff } from "@/lib/black-friday-auth";

export const metadata: Metadata = { title: "Visão geral | Black Friday Dial Fit" };

export default async function BlackFridayDashboardPage() {
  const staff = await getCurrentBlackFridayStaff();
  if (!staff) redirect("/admin/login");
  return <BlackFridayAdmin view="dashboard" staff={staff} isAdmin={staff.role === "administrator"} />;
}
