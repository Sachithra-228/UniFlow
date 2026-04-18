function LoadingSkeleton({ className = "h-10 w-full" }) {
  return <div className={`pulse-soft rounded-xl bg-gradient-to-r from-emerald-200/70 via-sky-100/60 to-emerald-100/70 dark:from-emerald-900/40 dark:via-slate-800/60 dark:to-sky-900/40 ${className}`} />;
}

export default LoadingSkeleton;
