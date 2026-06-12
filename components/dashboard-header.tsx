import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardHeader({ active, isAdmin = false }: { active: "dashboard" | "account" | "admin"; isAdmin?: boolean }) {
  return (
    <header className="border-b border-ink/10 bg-white px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/dashboard" className="text-xl font-black">
          <span className="hidden sm:inline">Melhores Momentos</span>
          <span className="sm:hidden">MM</span>
        </Link>
        <nav className="flex items-center gap-2">
          <HeaderLink href="/dashboard/conta" active={active === "account"}>Conta</HeaderLink>
          <HeaderLink href="/dashboard" active={active === "dashboard"}>Dashboard</HeaderLink>
          {isAdmin ? <HeaderLink href="/admin" active={active === "admin"}>Admin</HeaderLink> : null}
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-4 py-2 text-sm font-black transition",
        active ? "bg-rosewood text-white" : "text-ink/65 hover:bg-ink/5 hover:text-ink"
      )}
    >
      {children}
    </Link>
  );
}
