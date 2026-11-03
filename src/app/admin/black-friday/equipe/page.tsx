import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BlackFridayAdmin } from "@/components/black-friday/BlackFridayAdmin";
import { getCurrentBlackFridayStaff } from "@/lib/black-friday-auth";

export const metadata: Metadata = { title: "Equipe | Black Friday Dial Fit" };

export default async function BlackFridayTeamPage() {
  const staff = await getCurrentBlackFridayStaff();
  if (!staff) redirect("/admin/login");
  if (staff.role !== "administrator") redirect("/admin/black-friday");
  return <BlackFridayAdmin view="team" staff={staff} isAdmin />;
}
