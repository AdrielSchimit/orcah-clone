export function EmptyResults({ onFocusService, onFocusLocation }: { onFocusService: () => void; onFocusLocation: () => void }) {
  return (
    <div className="rounded-box border border-line bg-card p-8 text-center shadow-card">
      <p className="text-lg font-semibold text-text">Não encontramos profissionais para esse serviço nessa região.</p>
      <p className="mt-2 text-sm text-text-soft">Tente ampliar a região ou buscar outra categoria.</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onFocusLocation}
          className="min-h-11 rounded-btn border border-line px-4 text-sm font-semibold text-text hover:bg-paper"
        >
          Alterar localização
        </button>
        <button
          type="button"
          onClick={onFocusService}
          className="min-h-11 rounded-btn border border-line px-4 text-sm font-semibold text-text hover:bg-paper"
        >
          Buscar outro serviço
        </button>
      </div>
    </div>
  );
}
