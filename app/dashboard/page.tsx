import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { DashboardClient } from "@/components/dashboard-client";
import { DashboardHeader } from "@/components/dashboard-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login?redirectTo=/dashboard");

  const { data: pages } = await supabase
    .from("love_pages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#fbfbfb]">
      <DashboardHeader active="dashboard" />
      <section className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-rosewood">Dashboard</p>
              <h1 className="mt-1 text-4xl font-bold">Suas páginas</h1>
            </div>
            <ButtonLink href="/create">Criar nova página</ButtonLink>
          </header>

          <div className="mt-6 rounded-md border border-rosewood/20 bg-white p-5 shadow-soft">
            <p className="text-lg font-black text-ink">Sua página está pronta para ser usada.</p>
            <p className="mt-2 max-w-4xl text-base font-semibold leading-7 text-ink/65">
              Por aqui você pode visualizar ou editar o presente sempre que precisar. E o mais importante: para compartilhar com o seu amor, copie o link da página ou baixe o QR Code para imprimir, colocar em uma carta, enviar por mensagem ou entregar do seu jeito.
            </p>
          </div>

          <div className="mt-8">
            {pages?.length ? (
              <DashboardClient pages={pages} />
            ) : (
              <div className="rounded-md border border-ink/10 bg-white p-8 text-center shadow-soft">
                <h2 className="text-2xl font-bold">Nenhuma página criada ainda</h2>
                <p className="mt-2 text-ink/65">Crie uma página para começar a montar seu presente digital.</p>
                <ButtonLink href="/create" className="mt-6">Criar Minha Página</ButtonLink>
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
