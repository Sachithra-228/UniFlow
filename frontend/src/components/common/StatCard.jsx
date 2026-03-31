import { ArrowUpRight } from "lucide-react";
import Card from "./Card";

function StatCard({ title, value, subtitle, icon: Icon, accent = "from-cyan-500/25 to-teal-500/20" }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-[color:var(--text-muted)]">{title}</p>
          {Icon ? (
            <span className="rounded-xl border border-white/50 bg-white/75 p-2 dark:border-slate-500/30 dark:bg-slate-800/70">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle ? <p className="mt-1 text-xs text-[color:var(--text-muted)]">{subtitle}</p> : null}
          </div>
          <ArrowUpRight className="h-5 w-5 text-[color:var(--text-muted)]" />
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
