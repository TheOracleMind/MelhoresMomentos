import { supportEmail } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-white px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm font-semibold text-ink/60 sm:flex-row sm:items-center sm:justify-between">
        <p>Melhores Momentos</p>
        <div className="flex gap-5">
          <a href={`mailto:${supportEmail}`}>Contato</a>
          <a href="/termos">Termos de uso e privacidade</a>
        </div>
      </div>
    </footer>
  );
}
