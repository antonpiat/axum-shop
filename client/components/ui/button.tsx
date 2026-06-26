import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus-visible:ring-emerald-500/50",
  secondary:
    "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 focus-visible:ring-zinc-500/50",
  ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
  danger:
    "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 focus-visible:ring-red-500/50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
