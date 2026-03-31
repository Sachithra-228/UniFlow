import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

const variants = {
  primary:
    "bg-[color:var(--brand)] text-white shadow-sm hover:brightness-110 active:brightness-95 dark:text-slate-900 dark:font-bold",
  secondary:
    "bg-white/80 text-[color:var(--text)] border border-[color:var(--border)] hover:bg-white dark:bg-[color:var(--bg-soft)] dark:hover:bg-[color:var(--bg-soft)]/90",
  ghost: "bg-transparent text-[color:var(--text)] hover:bg-black/5 dark:hover:bg-white/10",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

const sizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export default Button;
