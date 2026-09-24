export function PhoneFrame({
  children,
  className = "",
  screenClassName = "bg-paper",
}: {
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
}) {
  return (
    <div
      className={`relative w-[272px] rounded-[2.6rem] bg-ink p-[9px] shadow-float ring-1 ring-ink-line ${className}`}
    >
      <div className={`relative flex h-[560px] flex-col overflow-hidden rounded-[2.1rem] text-left text-text ${screenClassName}`}>
        <div className="relative z-20 flex h-9 shrink-0 items-center justify-between px-6 text-[11px] font-semibold">
          <span>9:41</span>
          <span aria-hidden className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-ink" />
          <span aria-hidden className="flex items-center gap-1">
            <svg viewBox="0 0 16 10" className="h-2.5 w-4 fill-current">
              <rect x="0" y="6" width="3" height="4" rx="0.5" />
              <rect x="4.3" y="4" width="3" height="6" rx="0.5" />
              <rect x="8.6" y="2" width="3" height="8" rx="0.5" />
              <rect x="13" y="0" width="3" height="10" rx="0.5" />
            </svg>
            <span className="relative h-2.5 w-5 rounded-[3px] border border-current p-px">
              <span className="block h-full w-3/4 rounded-[1px] bg-current" />
            </span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
