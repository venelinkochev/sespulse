export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && <div className="mb-2 text-sm">{back}</div>}
        <h1 className="t-title">{title}</h1>
        {description && <p className="t-desc mt-1">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

export function SectionTitle({
  children,
  description,
  actions,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="t-section">{children}</h2>
        {description && <p className="t-desc mt-0.5">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
