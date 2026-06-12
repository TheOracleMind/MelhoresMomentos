import type { Metadata } from "next";
import { GiftPage } from "@/components/gift-page";
import { demoPage } from "@/lib/demo-page";

export const metadata: Metadata = {
  title: "Exemplo de presente | Melhores Momentos",
  description: "Veja um exemplo fictício de presente digital criado no Melhores Momentos."
};

export default function DemoPage() {
  return <GiftPage page={demoPage} />;
}
