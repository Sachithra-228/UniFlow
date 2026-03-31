function LoadingSkeleton({ className = "h-10 w-full" }) {
  return <div className={`pulse-soft rounded-xl bg-slate-300/45 dark:bg-slate-700/50 ${className}`} />;
}

export default LoadingSkeleton;
