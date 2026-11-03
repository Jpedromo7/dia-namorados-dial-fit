import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BlackFridayAdmin } from "@/components/black-friday/BlackFridayAdmin";
import { getCurrentBlackFridayStaff } from "@/lib/black-friday-auth";

export const metadata: Metadata = { title: "Interessados | Black Friday Dial Fit" };

export default async function BlackFridayLeadsPage() {
  const staff = await getCurrentBlackFridayStaff();
  if (!staff) redirect("/admin/login");
  return <BlackFridayAdmin view="leads" staff={staff} isAdmin={staff.role === "administrator"} />;
}
