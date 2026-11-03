import "server-only";

import { getAdminEmails } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlackFridayRole, BlackFridayStaff } from "@/lib/black-friday";

type StaffRow = BlackFridayStaff & { auth_user_id: string | null };

function bootstrapAdminEmails() {
  return new Set(
    [
      ...getAdminEmails(),
      ...(process.env.BLACK_FRIDAY_BOOTSTRAP_ADMIN_EMAIL ?? "").split(","),
    ]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function getCurrentBlackFridayStaff() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const email = user?.email?.trim().toLowerCase();
  if (userError || !user || !email) return null;

  const { data, error } = await admin
    .from("black_friday_staff")
    .select("id,email,role,is_active,auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (error) return null;

  let staff = data as StaffRow | null;
  if (!staff && bootstrapAdminEmails().has(email)) {
    const { data: created, error: createError } = await admin
      .from("black_friday_staff")
      .upsert(
        {
          email,
          auth_user_id: user.id,
          role: "administrator" satisfies BlackFridayRole,
          is_active: true,
        },
        { onConflict: "email" },
      )
      .select("id,email,role,is_active,auth_user_id")
      .single();
    if (createError || !created) return null;
    staff = created as StaffRow;
  }

  if (!staff || !staff.is_active) return null;
  if (staff.auth_user_id && staff.auth_user_id !== user.id) return null;

  if (!staff.auth_user_id) {
    const { data: linked, error: linkError } = await admin
      .from("black_friday_staff")
      .update({ auth_user_id: user.id })
      .eq("id", staff.id)
      .is("auth_user_id", null)
      .select("id,email,role,is_active,auth_user_id")
      .maybeSingle();

    if (linkError) return null;
    if (linked) staff = linked as StaffRow;
    else {
      const { data: existing, error: existingError } = await admin
        .from("black_friday_staff")
        .select("id,email,role,is_active,auth_user_id")
        .eq("id", staff.id)
        .maybeSingle();
      if (existingError || !existing || existing.auth_user_id !== user.id) return null;
      staff = existing as StaffRow;
    }
  }

  return {
    id: staff.id,
    email: staff.email,
    role: staff.role,
    is_active: staff.is_active,
    authUserId: user.id,
  } satisfies BlackFridayStaff & { authUserId: string };
}

export function isBlackFridayAdministrator(staff: Pick<BlackFridayStaff, "role">) {
  return staff.role === "administrator";
}
