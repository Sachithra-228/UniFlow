function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-white/45 px-6 py-12 text-center dark:bg-[color:var(--bg-soft)]/40">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-[color:var(--text-muted)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
