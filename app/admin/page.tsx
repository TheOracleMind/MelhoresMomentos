import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminSetupForm } from "@/components/admin-setup-form";
import { AdminSortableTable, type AdminTableRow } from "@/components/admin-sortable-table";
import { ButtonLink } from "@/components/button";
import { DashboardHeader } from "@/components/dashboard-header";
import { FunnelSplitControl } from "@/components/funnel-split-control";
import { SiteFooter } from "@/components/site-footer";
import { getAdminStatus, getCurrentUser, isUserAdmin } from "@/lib/admin";
import { calculateFunnelSnapshot } from "@/lib/admin-funnel";
import { formatPrice } from "@/lib/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate, getPublicPageUrl, isExpired } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

type AdminTab = "overview" | "users" | "pages" | "transactions";

type AdminPayment = {
  id: string;
  amount: number;
  paid_at: string;
  stripe_session_id: string;
  love_pages?: {
    title: string | null;
    slug: string;
    user_id: string | null;
    owner_email: string | null;
  }[] | {
    title: string | null;
    slug: string;
    user_id: string | null;
    owner_email: string | null;
  } | null;
};

type AdminPageRow = {
  id: string;
  title: string | null;
  slug: string;
  creator_name: string | null;
  recipient_name: string | null;
  user_id: string | null;
  owner_email: string | null;
  created_at: string;
  expires_at: string | null;
  status: string;
};

type FunnelSplitRow = {
  id: string;
  reason: string;
  landing_views: number;
  create_started: number;
  offer_views: number;
  purchases: number;
  step_1: number | null;
  step_2: number | null;
  step_3: number | null;
  step_4: number | null;
  step_5: number | null;
  step_6: number | null;
  step_7: number | null;
  step_8: number | null;
  created_at: string;
};

function normalizeTab(value?: string): AdminTab {
  return value === "users" || value === "pages" || value === "transactions" ? value : "overview";
}

function paymentPage(payment: AdminPayment) {
  return Array.isArray(payment.love_pages) ? payment.love_pages[0] : payment.love_pages;
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { hasAdmin } = await getAdminStatus();
  const user = await getCurrentUser();

  if (!hasAdmin) {
    return (
      <main className="min-h-screen bg-[#fbfbfb] px-5 py-12 sm:px-8">
        <AdminSetupForm />
      </main>
    );
  }

  if (!user) redirect("/login?redirectTo=/admin");
  if (!(await isUserAdmin(user.id))) redirect("/dashboard");

  const params = await searchParams;
  const activeTab = normalizeTab(params.tab);
  const admin = createSupabaseAdminClient();
  const [{ data: payments }, { data: pages, count: pageCount }, authUsers, { data: events }, { data: splits }] = await Promise.all([
    admin.from("payments").select("id, amount, paid_at, stripe_session_id, love_pages(title, slug, user_id, owner_email)").order("paid_at", { ascending: false }),
    admin.from("love_pages").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    listAllUsers(),
    admin.from("analytics_events").select("event_name, visitor_id, step_number, created_at"),
    admin.from("funnel_splits").select("*").order("created_at", { ascending: false })
  ]);

  const paymentRows = (payments || []) as AdminPayment[];
  const pageRows = (pages || []) as AdminPageRow[];
  const splitRows = (splits || []) as FunnelSplitRow[];
  const totalSales = paymentRows.reduce((sum, payment) => sum + payment.amount, 0);
  const latestSplitAt = splitRows[0]?.created_at || null;
  const currentFunnel = calculateFunnelSnapshot(events || [], paymentRows, latestSplitAt);
  const funnel = [
    { label: "Visitaram a página", value: currentFunnel.landingViews },
    { label: "Começaram a criar", value: currentFunnel.createStarted },
    { label: "Chegaram na oferta", value: currentFunnel.offerViews },
    { label: "Pagaram", value: currentFunnel.purchases }
  ];
  const createStepFunnel = [
    { label: "1. Nomes", value: currentFunnel.createSteps[0] || 0 },
    { label: "2. Datas", value: currentFunnel.createSteps[1] || 0 },
    { label: "3. Foto", value: currentFunnel.createSteps[2] || 0 },
    { label: "4. Top fotos", value: currentFunnel.createSteps[3] || 0 },
    { label: "5. Momentos", value: currentFunnel.createSteps[4] || 0 },
    { label: "6. Mensagens", value: currentFunnel.createSteps[5] || 0 },
    { label: "7. Previa", value: currentFunnel.createSteps[6] || 0 },
    { label: "8. Oferta", value: currentFunnel.createSteps[7] || 0 }
  ];

  const userStats = authUsers.map((authUser) => {
    const userPages = pageRows.filter((page) => page.user_id === authUser.id);
    const spent = paymentRows.reduce((sum, payment) => {
      const page = paymentPage(payment);
      return page?.user_id === authUser.id ? sum + payment.amount : sum;
    }, 0);

    return {
      id: authUser.id,
      email: authUser.email || "Sem email",
      createdAt: authUser.created_at,
      spent,
      pages: userPages.length
    };
  });

  return (
    <main className="min-h-screen bg-[#fbfbfb]">
      <DashboardHeader active="admin" isAdmin />
      <section className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-rosewood">Admin</p>
              <h1 className="mt-2 text-4xl font-black">Painel administrativo</h1>
            </div>
            <ButtonLink href="/create">Criar página grátis</ButtonLink>
          </div>

          <nav className="mt-8 flex flex-wrap gap-2">
            <TabLink href="/admin" active={activeTab === "overview"}>Visão geral</TabLink>
            <TabLink href="/admin?tab=users" active={activeTab === "users"}>Usuários</TabLink>
            <TabLink href="/admin?tab=pages" active={activeTab === "pages"}>Páginas</TabLink>
            <TabLink href="/admin?tab=transactions" active={activeTab === "transactions"}>Transações</TabLink>
          </nav>

          <div className="mt-8">
            {activeTab === "overview" ? (
              <OverviewTab
                totalSales={totalSales}
                salesCount={paymentRows.length}
                pageCount={pageCount || pageRows.length}
                userCount={authUsers.length}
                funnel={funnel}
                createStepFunnel={createStepFunnel}
                splitRows={splitRows}
              />
            ) : null}
            {activeTab === "users" ? <UsersTab users={userStats} /> : null}
            {activeTab === "pages" ? <PagesTab pages={pageRows} users={authUsers.map((item) => ({ id: item.id, email: item.email || "" }))} /> : null}
            {activeTab === "transactions" ? <TransactionsTab payments={paymentRows} /> : null}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

async function listAllUsers() {
  const admin = createSupabaseAdminClient();
  const users: User[] = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-4 py-2 text-sm font-black transition ${active ? "bg-rosewood text-white" : "bg-white text-ink/65 hover:bg-ink/5"}`}
    >
      {children}
    </Link>
  );
}

function OverviewTab({
  totalSales,
  salesCount,
  pageCount,
  userCount,
  funnel,
  createStepFunnel,
  splitRows
}: {
  totalSales: number;
  salesCount: number;
  pageCount: number;
  userCount: number;
  funnel: Array<{ label: string; value: number }>;
  createStepFunnel: Array<{ label: string; value: number }>;
  splitRows: FunnelSplitRow[];
}) {
  const base = Math.max(1, funnel[0]?.value || 0);
  const createStepBase = Math.max(1, createStepFunnel[0]?.value || 0);
  const splitTableRows = createSplitTableRows(splitRows);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Vendas totais" value={formatPrice(totalSales)} />
        <Metric label="Quantidade de vendas" value={String(salesCount)} />
        <Metric label="Páginas criadas" value={String(pageCount)} />
        <Metric label="Usuários" value={String(userCount)} />
      </div>

      <section className="overflow-hidden rounded-md border border-ink/10 bg-[#101827] p-6 text-white shadow-soft">
        <h2 className="text-3xl font-black">Funil de vendas</h2>
        <SalesFunnelChart funnel={funnel} base={base} />
      </section>

      <section className="overflow-hidden rounded-md border border-ink/10 bg-[#101827] p-6 text-white shadow-soft">
        <h2 className="text-3xl font-black">Funil dos passos da criacao</h2>
        <p className="mt-2 max-w-3xl text-sm font-bold text-white/60">
          Acompanhe ate qual etapa as pessoas chegam dentro do fluxo de criacao para encontrar pontos de abandono antes da oferta.
        </p>
        <SalesFunnelChart funnel={createStepFunnel} base={createStepBase} ariaLabel="Funil dos passos da criacao" />
      </section>

      <FunnelSplitControl rows={splitTableRows} />
    </div>
  );
}

function createSplitTableRows(splits: FunnelSplitRow[]): AdminTableRow[] {
  return splits.map((split) => ({
    id: split.id,
    cells: [
      { label: formatDate(split.created_at), sortValue: new Date(split.created_at).getTime() },
      { label: split.reason || "Split sem nome", sortValue: split.reason || "" },
      { label: split.landing_views.toLocaleString("pt-BR"), sortValue: split.landing_views },
      { label: split.create_started.toLocaleString("pt-BR"), sortValue: split.create_started },
      { label: split.offer_views.toLocaleString("pt-BR"), sortValue: split.offer_views },
      { label: split.purchases.toLocaleString("pt-BR"), sortValue: split.purchases },
      ...[split.step_1, split.step_2, split.step_3, split.step_4, split.step_5, split.step_6, split.step_7, split.step_8].map((value) => ({
        label: (value || 0).toLocaleString("pt-BR"),
        sortValue: value || 0
      }))
    ]
  }));
}

function SalesFunnelChart({ funnel, base, ariaLabel = "Funil de vendas" }: { funnel: Array<{ label: string; value: number }>; base: number; ariaLabel?: string }) {
  const compact = funnel.length > 4;
  const chartWidth = compact ? 1500 : 1000;
  const chartHeight = 280;
  const segmentWidth = chartWidth / funnel.length;
  const maxBand = 128;
  const minBand = 24;
  const centerY = 142;
  const colors = ["#2563eb", "#0891b2", "#4f46e5", "#7c3aed", "#c026d3", "#db2777", "#e11d48", "#f97316"];
  const percents = funnel.map((step) => (step.value / base) * 100);
  const bands = percents.map((percent) => Math.max(minBand, maxBand * (percent / 100)));

  return (
    <div className="mt-8 overflow-x-auto rounded-md border border-white/10 bg-[#0f172a] p-4">
      <svg className={compact ? "min-w-[1300px]" : "min-w-[900px]"} viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={ariaLabel}>
        {funnel.map((step, index) => {
          const x0 = index * segmentWidth;
          const x1 = x0 + segmentWidth;
          const currentBand = bands[index];
          const nextBand = bands[index + 1] ?? currentBand;
          const points = [
            `${x0},${centerY - currentBand / 2}`,
            `${x1},${centerY - nextBand / 2}`,
            `${x1},${centerY + nextBand / 2}`,
            `${x0},${centerY + currentBand / 2}`
          ].join(" ");
          const percent = percents[index];

          return (
            <g key={step.label}>
              <text x={x0 + segmentWidth / 2} y="28" textAnchor="middle" className="fill-white font-black" style={{ fontSize: compact ? 15 : 22 }}>
                {step.label}
              </text>
              {index > 0 ? <line x1={x0} x2={x0} y1="46" y2="250" stroke="rgba(226,232,240,0.42)" strokeWidth="3" /> : null}
              <polygon points={points} fill={colors[index % colors.length]} opacity="0.96" />
              <text x={x0 + segmentWidth / 2} y={centerY + 10} textAnchor="middle" className="fill-white font-black" style={{ fontSize: compact ? 24 : 32 }}>
                {formatPercent(percent)}
              </text>
              <text x={x0 + segmentWidth / 2} y="252" textAnchor="middle" className="fill-white font-black" style={{ fontSize: compact ? 18 : 24 }}>
                {step.value.toLocaleString("pt-BR")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function formatPercent(value: number) {
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString("pt-BR")}%`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-wide text-ink/45">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function UsersTab({ users }: { users: Array<{ id: string; email: string; createdAt: string; spent: number; pages: number }> }) {
  return (
    <AdminSortableTable
      headers={["Email", "Criado em", "Gasto", "Páginas"]}
      rows={users.map((user) => ({
        id: user.id,
        cells: [
          { label: user.email, sortValue: user.email },
          { label: formatDate(user.createdAt), sortValue: new Date(user.createdAt).getTime() },
          { label: formatPrice(user.spent), sortValue: user.spent },
          { label: String(user.pages), sortValue: user.pages }
        ]
      }))}
    />
  );
}

function PagesTab({ pages, users }: { pages: AdminPageRow[]; users: Array<{ id: string; email: string }> }) {
  const emailById = new Map(users.map((user) => [user.id, user.email]));
  return (
    <AdminSortableTable
      headers={["Página", "Status", "Criada em", "Expira em", "Link", "Usuário"]}
      rows={pages.map((page) => {
        const available = page.status === "active" && !isExpired(page.expires_at);
        const statusLabel = available ? "Disponível" : page.status === "pending_payment" ? "Pagamento pendente" : page.status === "draft" ? "Rascunho" : "Indisponível";
        const owner = page.owner_email || (page.user_id ? emailById.get(page.user_id) : "") || "Sem usuário";
        const publicUrl = getPublicPageUrl(page.slug);
        return {
          id: page.id,
          cells: [
            { label: page.title || "Melhores Momentos", sortValue: page.title || "" },
            { label: statusLabel, sortValue: `${available ? 0 : 1}-${statusLabel}`, badge: { tone: available ? "green" : "red", label: statusLabel } },
            { label: formatDate(page.created_at), sortValue: new Date(page.created_at).getTime() },
            { label: formatDate(page.expires_at), sortValue: page.expires_at ? new Date(page.expires_at).getTime() : Number.MAX_SAFE_INTEGER },
            { label: publicUrl, sortValue: publicUrl, href: `/p/${page.slug}` },
            { label: owner, sortValue: owner }
          ]
        };
      })}
    />
  );
}

function TransactionsTab({ payments }: { payments: AdminPayment[] }) {
  return (
    <AdminSortableTable
      headers={["Data", "Valor", "Usuário", "Página", "Stripe"]}
      rows={payments.map((payment) => {
        const page = paymentPage(payment);
        const owner = page?.owner_email || "Sem email";
        const title = page?.title || "Melhores Momentos";
        return {
          id: payment.id,
          cells: [
            { label: formatDate(payment.paid_at), sortValue: new Date(payment.paid_at).getTime() },
            { label: formatPrice(payment.amount), sortValue: payment.amount },
            { label: owner, sortValue: owner },
            { label: title, sortValue: title },
            { label: payment.stripe_session_id, sortValue: payment.stripe_session_id }
          ]
        };
      })}
    />
  );
}
