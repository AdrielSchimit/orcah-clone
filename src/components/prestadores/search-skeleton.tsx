export function SearchSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando resultados">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-box border border-line bg-card shadow-card">
          <div className="aspect-[4/3] animate-pulse bg-paper-alt" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-paper-alt" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-paper-alt" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-paper-alt" />
          </div>
          <div className="grid gap-2 border-t border-line p-4 sm:grid-cols-2">
            <div className="h-11 animate-pulse rounded-btn bg-paper-alt" />
            <div className="h-11 animate-pulse rounded-btn bg-paper-alt" />
          </div>
        </div>
      ))}
    </div>
  );
}
