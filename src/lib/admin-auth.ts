import { createSupabaseServerClient } from "@/lib/supabase/server";

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getCurrentAdmin() {
  const supabase = await createSupabaseServerClient();
  const adminEmails = getAdminEmails();

  if (!supabase || adminEmails.length === 0) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase();

  if (!user || !email || !adminEmails.includes(email)) {
    return null;
  }

  return {
    id: user.id,
    email,
  };
}
