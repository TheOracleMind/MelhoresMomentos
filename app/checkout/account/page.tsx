import { CreateAccountForm } from "@/components/create-account-form";

export default async function CheckoutAccountPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  return (
    <main className="flex min-h-screen items-center px-5 py-12 sm:px-8">
      {sessionId ? (
        <CreateAccountForm sessionId={sessionId} />
      ) : (
        <div className="mx-auto max-w-md rounded-md border border-ink/10 bg-white p-6 text-center shadow-soft">
          <h1 className="text-3xl font-bold">Sessão não encontrada</h1>
          <p className="mt-3 text-ink/65">Não recebemos o identificador do pagamento.</p>
        </div>
      )}
    </main>
  );
}
