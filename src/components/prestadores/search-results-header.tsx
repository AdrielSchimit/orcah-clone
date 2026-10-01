export function SearchResultsHeader({
  headline,
  total,
  sort,
  onSortChange,
  tipo,
  onTipoChange,
}: {
  headline: string | null;
  total: number;
  sort: string;
  onSortChange: (value: string) => void;
  tipo: string;
  onTipoChange: (value: string) => void;
}) {
  if (!headline) return null;

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-xl font-semibold leading-snug md:text-2xl">{headline}</h2>
        <p className="mt-1 text-sm text-text-soft">
          {total} {total === 1 ? "profissional encontrado" : "profissionais encontrados"}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex min-w-[9rem] flex-col gap-1 text-xs font-medium text-text-soft">
          Tipo
          <select
            value={tipo}
            onChange={(event) => onTipoChange(event.target.value)}
            className="min-h-11 rounded-btn border border-line bg-card px-3 text-sm text-text"
          >
            <option value="">Todos</option>
            <option value="profissional">Profissional</option>
            <option value="empresa">Empresa</option>
          </select>
        </label>
        <label className="flex min-w-[9rem] flex-col gap-1 text-xs font-medium text-text-soft">
          Ordenar por
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="min-h-11 rounded-btn border border-line bg-card px-3 text-sm text-text"
          >
            <option value="relevancia">Relevância</option>
            <option value="nome">Nome</option>
          </select>
        </label>
      </div>
    </div>
  );
}
