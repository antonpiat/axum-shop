import { cn } from "@/lib/utils";

type Variant = "error" | "success" | "info";

const variants: Record<Variant, string> = {
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  info: "border-zinc-700 bg-zinc-800/80 text-zinc-300",
};

export function Alert({
  children,
  variant = "info",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variants[variant],
        className,
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
