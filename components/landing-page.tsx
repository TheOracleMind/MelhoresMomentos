"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Gift, Heart, ImagePlus, QrCode, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { SiteFooter } from "@/components/site-footer";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { trackMetaPixelEvent } from "@/lib/meta-pixel";
import { formatPrice, initialPlans } from "@/lib/plans";

const steps = [
  {
    title: "Fale sobre quem você ama",
    description: "Comece com os nomes, as datas importantes e a mensagem que vai abrir o presente com emoção.",
    icon: Heart
  },
  {
    title: "Personalize com seus momentos",
    description: "Adicione fotos, escolha as cinco favoritas, conte sua história e monte uma retrospectiva animada.",
    icon: ImagePlus
  },
  {
    title: "Gere seu link e QR Code",
    description: "Depois do pagamento, a página fica online instantaneamente para você compartilhar do jeito que quiser.",
    icon: QrCode
  },
  {
    title: "Surpreenda o seu amor",
    description: "Envie o link, coloque o QR Code em uma carta ou mostre pessoalmente. A reação é a parte mais bonita.",
    icon: Gift
  }
];

const testimonials = [
  {
    name: "Guilherme",
    text: "Eu queria fazer algo diferente, mas sem passar dias editando vídeo. Em poucos minutos estava tudo pronto, com link e QR Code para entregar."
  },
  {
    name: "Mayara",
    text: "Recebi a página no celular e fui passando por cada foto como se fosse uma carta viva. Foi um dos presentes mais carinhosos que já ganhei."
  },
  {
    name: "Rafael",
    text: "O melhor foi conseguir colocar nossas fotos, datas e momentos sem complicação. Pareceu presente caro, mas foi simples de criar."
  },
  {
    name: "Camila",
    text: "Eu chorei quando vi a retrospectiva. Não era só uma página bonita, era a nossa história organizada de um jeito muito especial."
  },
  {
    name: "Bruno",
    text: "Fiz no intervalo do trabalho e mandei o QR Code junto com flores. Ela abriu na hora e ficou emocionada com cada detalhe."
  },
  {
    name: "Larissa",
    text: "Amei porque não foi um presente genérico. Tinha nossas fotos, nossas datas e mensagens que só a gente entende."
  }
];

const benefits = [
  "Abre perfeito no celular.",
  "Mostra fotos, textos e animações.",
  "Revela as 5 melhores fotos do casal.",
  "Conta a história em uma linha do tempo.",
  "Entrega link e QR Code na hora.",
  "Permite editar se precisar ajustar algo."
];

const faqs = [
  ["Para quem eu posso criar esse presente?", "Para namorada, namorado, esposa, marido, noiva, noivo ou qualquer pessoa especial que merece receber uma lembrança personalizada."],
  ["O site fica no ar para sempre?", "Não. Você escolhe o tempo no checkout: 24 horas para uma surpresa rápida ou 30 dias para a pessoa rever com calma."],
  ["Como eu entrego o presente?", "Depois do pagamento, você recebe um link público e um QR Code. Dá para enviar por mensagem, colocar em uma carta ou imprimir o QR Code."],
  ["Como funciona a criação?", "Você responde alguns passos simples, envia fotos, escreve mensagens e escolhe o plano. Depois disso a página fica online."],
  ["E se eu errar alguma coisa?", "Você pode editar a página pelo dashboard depois do pagamento, incluindo textos, fotos e momentos."],
  ["Preciso criar conta antes?", "Não para começar. Você cria o presente primeiro; depois do pagamento, define a senha para acessar e editar."]
];

export function LandingPage() {
  useEffect(() => {
    trackAnalyticsEvent("landing_view");
    trackMetaPixelEvent("PageView");
  }, []);

  function handleClick(event: MouseEvent<HTMLElement>) {
    const link = (event.target as HTMLElement).closest("a");
    if (link?.getAttribute("href") === "/create") {
      trackAnalyticsEvent("create_started");
    }
  }

  return (
    <main className="bg-[#fbfbfb] text-ink" onClick={handleClick}>
      <div className="sticky top-0 z-50 bg-rosewood px-5 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-white">
        Desconto Especial de Lançamento
      </div>

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="text-xl font-black">Melhores Momentos</Link>
        <div className="flex items-center gap-3">
          <ButtonLink href="/login" variant="ghost">Entrar</ButtonLink>
          <ButtonLink href="/create">Criar Página</ButtonLink>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pb-20 pt-8 sm:px-8">
        <HeartParticles />
        <div className="mx-auto grid min-h-[calc(100vh-132px)] max-w-6xl items-center gap-12 md:grid-cols-[1.02fr_0.78fr]">
          <div className="relative z-10">
            <p className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black uppercase text-rosewood shadow-soft">
              <Sparkles className="h-4 w-4" />
              presente digital em poucos minutos
            </p>
            <h1 className="animate-fade-up max-w-4xl text-5xl font-black leading-[0.95] [animation-delay:80ms] sm:text-7xl lg:text-8xl">
              Declare seu <span className="text-rosewood">amor</span> pela sua namorada.
            </h1>
            <p className="animate-fade-up mt-6 max-w-2xl text-xl font-semibold leading-9 text-ink/72 [animation-delay:160ms]">
              Em menos de cinco minutos, você vai criar um presente digital na forma de site, com imagens, animações e até mesmo uma linha do tempo com uma retrospectiva animada para o seu amor.
            </p>
            <div className="animate-fade-up mt-9 [animation-delay:240ms]">
              <ButtonLink href="/create" className="min-h-16 px-9 text-xl">
                Criar minha página agora
                <ArrowRight className="h-6 w-6" />
              </ButtonLink>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[360px] md:max-w-[460px]">
            <div className="rounded-[2rem] border-[10px] border-ink bg-ink p-2 shadow-[0_28px_80px_rgba(17,14,12,0.24)]">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[1.35rem] bg-[#151116]">
                <iframe
                  className="h-full w-full border-0 bg-white"
                  src="/demo"
                  title="Exemplo interativo de presente digital"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-full bg-black/70 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft backdrop-blur">
                  Role dentro do celular
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-sm font-bold leading-6 text-ink/55">
              Veja um exemplo de como vai ficar!
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-rosewood">Como funciona</p>
            <h2 className="mt-4 text-5xl font-black leading-[0.98] sm:text-7xl">Crie um presente inesquecível em alguns passos simples.</h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={index * 90} className="rounded-md border-2 border-ink/10 bg-[#fbfbfb] p-6 shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rosewood text-xl font-black text-white">
                      {index + 1}
                    </div>
                    <div>
                      <Icon className="mb-4 h-7 w-7 text-rosewood" />
                      <h3 className="text-3xl font-black leading-tight">{step.title}</h3>
                      <p className="mt-3 text-lg font-semibold leading-8 text-ink/65">{step.description}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="mt-12 text-center">
            <ButtonLink href="/create" className="min-h-16 px-9 text-xl">
              Começar a criar meu presente
              <ArrowRight className="h-6 w-6" />
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-20 sm:px-8">
        <HeartParticles />
        <div className="relative z-10 mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-rosewood">Depoimentos</p>
            <h2 className="mt-4 text-5xl font-black leading-[0.98] sm:text-7xl">Presentes que viraram reação de verdade.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial.name} as="article" delay={index * 70} className="rounded-md border-2 border-ink/10 bg-white p-6 shadow-soft">
                <div className="text-xl text-rosewood">★★★★★</div>
                <p className="mt-5 text-lg font-bold leading-8 text-ink/76">“{testimonial.text}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-lg font-black text-rosewood">
                    {testimonial.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-black">{testimonial.name}</p>
                    <p className="text-sm font-bold text-ink/50">Cliente Melhores Momentos</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12 text-center">
            <ButtonLink href="/create" className="min-h-16 px-9 text-xl">
              Quero fazer uma surpresa assim
              <ArrowRight className="h-6 w-6" />
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Reveal className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-rosewood">Tudo pronto para presentear</p>
            <h2 className="mt-4 text-5xl font-black leading-[0.98] sm:text-7xl">Você cria a emoção. A gente monta a experiência.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-9 text-ink/68">
              Um presente digital bonito, rápido de criar e fácil de entregar.
            </p>
          </Reveal>

          <div className="mt-14 space-y-6">
            {benefits.map((benefit, index) => (
              <Reveal key={benefit} delay={index * 80} className="flex items-center gap-5 border-b border-ink/10 pb-6 last:border-b-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rosewood text-white">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black leading-tight sm:text-4xl">{benefit}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12 text-center">
            <ButtonLink href="/create" className="min-h-16 px-9 text-xl">
              Criar presente digital
              <ArrowRight className="h-6 w-6" />
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-200">Preço simples</p>
            <h2 className="mt-4 text-5xl font-black leading-[0.98] sm:text-7xl">Escolha por quanto tempo o presente fica no ar.</h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {initialPlans.map((plan, index) => (
              <Reveal key={plan.id} delay={index * 100} className="rounded-md border border-white/10 bg-white/8 p-7">
                <p className="text-sm font-black uppercase text-red-200">
                  {plan.id === "initial_365d" ? "Melhor custo-benefício" : "Mais econômico"}
                </p>
                <p className="mt-2 text-3xl font-black">{plan.label}</p>
                <p className="mt-4 text-6xl font-black">{formatPrice(plan.price)}</p>
                <p className="mt-4 text-lg font-semibold leading-8 text-white/72">
                  {plan.id === "initial_365d"
                    ? "Para deixar a surpresa disponível por 30 dias e permitir que a pessoa reveja tudo com calma."
                    : "Para uma surpresa rápida, intensa e disponível por 24 horas depois do pagamento."}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10 text-center">
            <ButtonLink href="/create" className="min-h-16 bg-rosewood px-9 text-xl text-white shadow-[0_8px_0_#9f172a] hover:bg-red-500">
              Começar a criar
              <ArrowRight className="h-6 w-6" />
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Reveal className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-rosewood">Perguntas frequentes</p>
            <h2 className="mt-4 text-5xl font-black leading-[0.98] sm:text-7xl">Dúvidas antes de criar?</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {faqs.map(([question, answer], index) => (
              <Reveal key={question} delay={index * 60} as="details" className="rounded-md border-2 border-ink/10 bg-white p-5 shadow-soft">
                <summary className="cursor-pointer text-lg font-black">{question}</summary>
                <p className="mt-3 font-semibold leading-7 text-ink/70">{answer}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <ButtonLink href="/create" className="min-h-16 px-9 text-xl">
              Criar minha página
              <ArrowRight className="h-6 w-6" />
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Reveal({
  as: Tag = "div",
  children,
  className,
  delay = 0
}: {
  as?: "div" | "article" | "details";
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={`scroll-reveal ${visible ? "scroll-reveal-visible" : ""} ${className || ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

function HeartParticles() {
  return (
    <div className="heart-particles heart-particles-active" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index}>{"\u2665"}</span>
      ))}
    </div>
  );
}
