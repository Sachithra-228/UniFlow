import { titleCase } from "../../utils/format";
import { cn } from "../../utils/cn";

const styles = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100",
  IN_USE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/45 dark:text-cyan-100",
  MAINTENANCE: "bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-100",
  INACTIVE: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-100",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-900/45 dark:text-rose-100",
  CANCELLED: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/45 dark:text-indigo-100",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100",
  CLOSED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
  ROOM: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/45 dark:text-indigo-100",
  LAB: "bg-sky-100 text-sky-800 dark:bg-sky-900/45 dark:text-sky-100",
  EQUIPMENT: "bg-violet-100 text-violet-800 dark:bg-violet-900/45 dark:text-violet-100",
  HARDWARE: "bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-100",
  SOFTWARE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/45 dark:text-cyan-100",
  NETWORK: "bg-blue-100 text-blue-800 dark:bg-blue-900/45 dark:text-blue-100",
  FACILITY: "bg-teal-100 text-teal-800 dark:bg-teal-900/45 dark:text-teal-100",
  OTHER: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  LOW: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  MEDIUM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/45 dark:text-cyan-100",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-100",
  CRITICAL: "bg-rose-100 text-rose-800 dark:bg-rose-900/45 dark:text-rose-100",
  USER: "bg-teal-100 text-teal-800 dark:bg-teal-900/45 dark:text-teal-100",
  ADMIN: "bg-rose-100 text-rose-800 dark:bg-rose-900/45 dark:text-rose-100",
  STUDENT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/45 dark:text-cyan-100",
  STAFF: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/45 dark:text-emerald-100",
  TECHNICIAN: "bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-100",
  GOOGLE: "bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100",
  LOCAL: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
};

function Badge({ value, className }) {
  if (value === null || value === undefined || value === "") {
    return <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold dark:bg-slate-700">N/A</span>;
  }

  const key = String(value).toUpperCase();
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", styles[key], className)}>
      {titleCase(String(value))}
    </span>
  );
}

export default Badge;
