import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const params = await searchParams;
  const redirectTo = params.redirectTo || "/dashboard";

  if (data.user) redirect(redirectTo);

  return (
    <main className="flex min-h-screen items-center px-5 py-12 sm:px-8">
      <AuthForm redirectTo={redirectTo} />
    </main>
  );
}
