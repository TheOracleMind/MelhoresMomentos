import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export async function isUserAdmin(userId: string | null | undefined) {
  if (!userId) return false;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function getAdminStatus() {
  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from("admin_users")
    .select("user_id", { count: "exact", head: true });

  return { hasAdmin: Boolean(count && count > 0) };
}

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user || !(await isUserAdmin(user.id))) return null;
  return user;
}
