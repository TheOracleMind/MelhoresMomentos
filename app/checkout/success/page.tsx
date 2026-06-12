import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { confirmStripeCheckoutSession } from "@/lib/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return <CheckoutMessage title="Sessão não encontrada" message="Não recebemos o identificador do pagamento." />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  let redirectTo = "";
  try {
    const result = await confirmStripeCheckoutSession(sessionId, auth.user?.id, auth.user?.email || undefined);

    if (auth.user || !result.needsAccount) {
      redirectTo = "/dashboard?checkout=success";
    } else {
      redirectTo = `/checkout/account?session_id=${encodeURIComponent(sessionId)}`;
    }
  } catch (error) {
    return (
      <CheckoutMessage
        title="Não foi possível confirmar o pagamento"
        message={error instanceof Error ? error.message : "Tente abrir o dashboard em alguns instantes."}
      />
    );
  }

  redirect(redirectTo);
}

function CheckoutMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12 text-center">
      <div className="max-w-md rounded-md border border-ink/10 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 leading-7 text-ink/65">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/dashboard">Ir ao dashboard</ButtonLink>
          <Link href="/" className="inline-flex min-h-14 items-center justify-center rounded-md px-7 py-3 text-base font-extrabold text-ink">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
