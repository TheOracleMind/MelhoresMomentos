export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-4xl font-bold">Privacidade</h1>
      <p className="mt-5 leading-7 text-ink/70">
        Os dados da conta e as imagens são armazenados no Supabase com políticas de acesso por usuário. A página pública
        só exibe o conteúdo quando o pagamento está ativo e a data de expiração ainda não passou.
      </p>
    </main>
  );
}
