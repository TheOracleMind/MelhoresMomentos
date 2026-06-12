import { redirect } from "next/navigation";
import { AccountActions } from "@/components/account-actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { SiteFooter } from "@/components/site-footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice, PLANS } from "@/lib/plans";
import type { PaymentType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type PaymentRow = {
  id: string;
  amount: number;
  payment_type: PaymentType;
  paid_at: string;
  stripe_session_id: string;
  love_pages?: {
    title: string | null;
    slug: string;
  }[] | {
    title: string | null;
    slug: string;
  } | null;
};

function getPaymentPage(payment: PaymentRow) {
  return Array.isArray(payment.love_pages) ? payment.love_pages[0] : payment.love_pages;
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login?redirectTo=/dashboard/conta");

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, payment_type, paid_at, stripe_session_id, love_pages(title, slug)")
    .order("paid_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#fbfbfb]">
      <DashboardHeader active="account" />
      <section className="px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold text-rosewood">Conta</p>
            <h1 className="mt-1 text-4xl font-bold">Informações da conta</h1>

            <div className="mt-6 rounded-md bg-[#fbfbfb] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-ink/45">Email usado</p>
              <p className="mt-1 break-all text-lg font-black">{auth.user.email}</p>
            </div>

            <div className="mt-6 rounded-md bg-[#fbfbfb] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-ink/45">Suporte</p>
              <a className="mt-1 inline-flex break-all text-lg font-black text-rosewood" href="mailto:guilherme@unidaystudio.com.br">
                guilherme@unidaystudio.com.br
              </a>
            </div>

            <div className="mt-6">
              <AccountActions />
            </div>
          </section>

          <section className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-3xl font-bold">Histórico de transações</h2>
            <div className="mt-6 space-y-3">
              {payments?.length ? (
                (payments as PaymentRow[]).map((payment) => {
                  const page = getPaymentPage(payment);

                  return (
                    <div key={payment.id} className="rounded-md border border-ink/10 bg-[#fbfbfb] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-black">{page?.title || "Melhores Momentos"}</p>
                          <p className="mt-1 text-sm font-semibold text-ink/55">{PLANS[payment.payment_type]?.label || payment.payment_type}</p>
                          <p className="mt-1 text-xs font-semibold text-ink/45">Stripe: {payment.stripe_session_id}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xl font-black">{formatPrice(payment.amount)}</p>
                          <p className="mt-1 text-sm font-semibold text-ink/55">{formatDate(payment.paid_at)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-md border border-ink/10 bg-[#fbfbfb] p-5 text-center">
                  <p className="font-bold text-ink/60">Nenhuma transação encontrada ainda.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
