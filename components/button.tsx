import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants = {
  primary: "bg-rosewood text-white shadow-[0_8px_0_#9f172a] hover:bg-red-500 active:translate-y-1 active:shadow-[0_4px_0_#9f172a]",
  secondary: "bg-white text-ink border-2 border-ink/10 hover:border-rosewood/45",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-white text-rosewood border-2 border-rosewood/25 hover:bg-petal/35"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-md px-7 py-3 text-base font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: keyof typeof variants;
};

export function ButtonLink({ className, variant = "primary", href, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-md px-7 py-3 text-base font-extrabold transition",
        variants[variant],
        className
      )}
      href={href}
      {...props}
    />
  );
}
