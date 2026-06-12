import Link from "next/link";
import { ArrowRight, Check, Heart, Link2, QrCode, Smartphone, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { formatPrice, initialPlans } from "@/lib/plans";

const benefits = [
  ["Fácil de criar", Sparkles],
  ["Funciona no celular", Smartphone],
  ["Link compartilhável", Link2],
  ["QR Code automático", QrCode],
  ["Design bonito", Heart],
  ["Pronto em poucos minutos", Check]
];

export function LandingPage() {
  return (
    <main>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="text-lg font-bold">Melhores Momentos</Link>
        <div className="flex items-center gap-3">
          <ButtonLink href="/login" variant="ghost">Entrar</ButtonLink>
          <ButtonLink href="/create">Criar</ButtonLink>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-84px)] max-w-6xl items-center gap-10 px-5 pb-14 pt-6 sm:px-8 md:grid-cols-[1fr_0.9fr]">
        <div>
          <h1 className="text-5xl font-bold leading-[1.02] sm:text-7xl">Crie um presente único em poucos minutos.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/72">
            Monte uma página personalizada com fotos, mensagens, timeline, link exclusivo e QR Code para entregar a uma pessoa especial.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/create" className="min-h-12">
              Criar Minha Página
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#demo" variant="secondary" className="min-h-12">Ver demonstração</ButtonLink>
          </div>
        </div>

        <div id="demo" className="relative mx-auto w-full max-w-sm rounded-[2rem] border border-ink/10 bg-ink p-3 shadow-soft">
          <div className="overflow-hidden rounded-[1.45rem] bg-paper">
            <div className="relative h-72 bg-[url('https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center">
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide">Presente digital</p>
                <h2 className="mt-2 text-3xl font-bold leading-tight">Nossa história favorita</h2>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-md border border-ink/10 bg-white p-4">
                <p className="text-xs font-semibold text-rosewood">2 anos e 4 meses</p>
                <p className="mt-2 text-sm text-ink/70">Uma timeline leve para guardar momentos, fotos e mensagens.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="aspect-square rounded-md bg-petal" />
                <div className="aspect-square rounded-md bg-honey/55" />
                <div className="aspect-square rounded-md bg-moss/25" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white/72 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">Como funciona</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {["Adicione suas fotos e momentos especiais", "Personalize sua página", "Compartilhe com quem você ama"].map((item, index) => (
              <div key={item} className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-petal text-sm font-bold text-rosewood">{index + 1}</span>
                <p className="mt-5 text-lg font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">Tudo pronto para presentear</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(([label, Icon]) => (
              <div key={label as string} className="flex items-center gap-3 rounded-md border border-ink/10 bg-white/80 p-4">
                <Icon className="h-5 w-5 text-rosewood" />
                <span className="font-semibold">{label as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink px-5 py-16 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">Preços simples</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {initialPlans.map((plan) => (
              <div key={plan.id} className="rounded-md border border-white/10 bg-white/8 p-6">
                <p className="text-sm font-semibold text-petal">{plan.label}</p>
                <p className="mt-3 text-4xl font-bold">{formatPrice(plan.price)}</p>
                <p className="mt-3 text-white/72">{plan.description}</p>
                <ButtonLink href="/create" className="mt-6 bg-white text-ink hover:bg-petal">Escolher plano</ButtonLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
          <div className="mt-8 space-y-3">
            {[
              ["Preciso criar conta?", "Sim. A conta protege seus dados, permite editar depois e acessar o dashboard."],
              ["Posso editar depois?", "Sim. Páginas pagas podem ser editadas pelo mesmo fluxo de criação."],
              ["Posso renovar uma página expirada?", "Sim. O dashboard mostra opções de renovação para 24 horas ou 365 dias."],
              ["Como compartilho a página?", "Você recebe um link público e um QR Code para baixar ou enviar."]
            ].map(([question, answer]) => (
              <details key={question} className="rounded-md border border-ink/10 bg-white/80 p-5">
                <summary className="cursor-pointer font-bold">{question}</summary>
                <p className="mt-3 text-ink/70">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between">
          <p>Melhores Momentos</p>
          <div className="flex gap-5">
            <a href="mailto:contato@exemplo.com">Contato</a>
            <a href="/termos">Termos</a>
            <a href="/privacidade">Privacidade</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
