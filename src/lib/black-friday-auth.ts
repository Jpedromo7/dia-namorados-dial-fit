import "server-only";

import { queryNeon } from "@/lib/neon/database";
import { getNeonAuth } from "@/lib/neon/auth-server";
import type { BlackFridayStaff } from "@/lib/black-friday";

type StaffRow = BlackFridayStaff & { auth_user_id: string | null };

export async function getCurrentBlackFridayStaff() {
  const auth = getNeonAuth();
  if (!auth) return null;
  let session;
  try {
    const result = await auth.getSession();
    session = result.data;
  } catch {
    return null;
  }
  const user = session?.user;
  const email = user?.email?.trim().toLowerCase();
  if (!user?.id || !user.emailVerified || !email) return null;

  const bootstrapEmail = process.env.BLACK_FRIDAY_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (bootstrapEmail && email === bootstrapEmail) {
    await queryNeon<StaffRow>(
      `insert into public.black_friday_staff (email, auth_user_id, role, is_active)
       values ($1, $2::uuid, 'administrator', true)
       on conflict (email) do update set auth_user_id = coalesce(public.black_friday_staff.auth_user_id, excluded.auth_user_id)
       returning id, email, role, is_active, auth_user_id`,
      [email, user.id],
    );
  }

  let [staff] = await queryNeon<StaffRow>(
    `select id, email, role, is_active, auth_user_id from public.black_friday_staff where email = $1 limit 1`,
    [email],
  );
  if (!staff || !staff.is_active || (staff.auth_user_id && staff.auth_user_id !== user.id)) return null;

  if (!staff.auth_user_id) {
    const [linked] = await queryNeon<StaffRow>(
      `update public.black_friday_staff set auth_user_id = $2::uuid
       where id = $1::uuid and auth_user_id is null
       returning id, email, role, is_active, auth_user_id`,
      [staff.id, user.id],
    );
    if (linked) staff = linked;
    else {
      [staff] = await queryNeon<StaffRow>(
        `select id, email, role, is_active, auth_user_id from public.black_friday_staff where id = $1::uuid limit 1`,
        [staff.id],
      );
      if (!staff || staff.auth_user_id !== user.id) return null;
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
