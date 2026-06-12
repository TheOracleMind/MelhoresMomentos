import type { PaymentType } from "@/lib/types";

export type Plan = {
  id: PaymentType;
  label: string;
  price: number;
  durationHours: number;
  checkoutLabel: string;
  description: string;
};

export const PLANS: Record<PaymentType, Plan> = {
  initial_24h: {
    id: "initial_24h",
    label: "24 horas",
    price: 1990,
    durationHours: 24,
    checkoutLabel: "Página Melhores Momentos - 24 horas",
    description: "Ideal para uma surpresa rápida no Dia dos Namorados."
  },
  initial_365d: {
    id: "initial_365d",
    label: "365 dias",
    price: 2990,
    durationHours: 365 * 24,
    checkoutLabel: "Página Melhores Momentos - 365 dias",
    description: "Perfeita para manter o presente disponível o ano todo."
  },
  renewal_24h: {
    id: "renewal_24h",
    label: "Renovar por 24 horas",
    price: 990,
    durationHours: 24,
    checkoutLabel: "Renovação Melhores Momentos - 24 horas",
    description: "Reative uma página expirada por mais 24 horas."
  },
  renewal_365d: {
    id: "renewal_365d",
    label: "Renovar por 365 dias",
    price: 1990,
    durationHours: 365 * 24,
    checkoutLabel: "Renovação Melhores Momentos - 365 dias",
    description: "Reative uma página expirada por mais um ano."
  }
};

export const initialPlans = [PLANS.initial_24h, PLANS.initial_365d];
export const renewalPlans = [PLANS.renewal_24h, PLANS.renewal_365d];

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}
