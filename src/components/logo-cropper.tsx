"use client";

import { useEffect, useId, useRef, useState } from "react";

export function LogoCropper({ file, busy, uploadError, onCancel, onSave, variant = "logo" }: {
  file: File;
  variant?: "logo" | "cover";
  busy: boolean;
  uploadError?: string;
  onCancel: () => void;
  onSave: (file: File) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imageRef.current = img; setReady(true); };
    img.onerror = () => setError("Não foi possível abrir esta imagem. Escolha outra.");
    img.src = url;
    return () => { img.onload = null; img.onerror = null; URL.revokeObjectURL(url); };
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !ready) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cw=canvas.width, ch=canvas.height;
    const scale = Math.min(cw/img.naturalWidth,ch/img.naturalHeight)*zoom;
    const width=img.naturalWidth*scale,height=img.naturalHeight*scale;
    ctx.fillStyle = variant === "cover" ? "#151f38" : "#ffffff";
    ctx.fillRect(0,0,cw,ch);
    const x=(cw-width)/2+position.x*cw,y=(ch-height)/2+position.y*ch;
    ctx.drawImage(img,x,y,width,height);
  }, [ready, zoom, position, variant]);

  async function save() {
    setError("");
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error();
      await onSave(new File([blob], variant === "cover" ? "capa.png" : "logo.png", { type: "image/png" }));
    } catch {
      setError("Não foi possível salvar a imagem. Tente novamente.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busy) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCancel();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-line bg-card p-6 text-text shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-lg font-semibold">{variant === "cover" ? "Ajustar capa" : "Ajustar logo"}</h2>
        <button type="button" autoFocus disabled={busy} onClick={onCancel} aria-label={variant === "cover" ? "Fechar ajuste da capa" : "Fechar ajuste da logo"} className="flex h-9 w-9 items-center justify-center rounded-full text-text-soft hover:bg-paper disabled:opacity-60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <p className="mt-1 text-sm text-text-soft">Arraste para posicionar e ajuste o zoom.</p>
      <div className={`relative mx-auto my-5 w-full overflow-hidden rounded-xl bg-white ${variant === "cover" ? "aspect-[3/1]" : "aspect-square max-w-64"}`}>
        <canvas
          ref={canvasRef} width={variant === "cover" ? 1500 : 768} height={variant === "cover" ? 500 : 768}
          aria-label="Prévia do recorte; arraste ou use as setas do teclado para posicionar"
          tabIndex={0}
          onKeyDown={(event) => {
            if (busy || !ready) return;
            const moves: Record<string, [number, number]> = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0], ArrowUp: [0, -0.02], ArrowDown: [0, 0.02] };
            const move = moves[event.key];
            if (!move) return;
            event.preventDefault();
            setPosition((p) => ({ x: Math.max(-1, Math.min(1, p.x + move[0])), y: Math.max(-1, Math.min(1, p.y + move[1])) }));
          }}
          className="h-full w-full touch-none cursor-move"
          onPointerDown={(event) => {
            if (busy || !ready) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, left: position.x, top: position.y };
          }}
          onPointerMove={(event) => {
            if (!drag.current || busy) return;
            const size = event.currentTarget.getBoundingClientRect().width;
            setPosition({
              x: Math.max(-1, Math.min(1, drag.current.left + (event.clientX - drag.current.x) / size)),
              y: Math.max(-1, Math.min(1, drag.current.top + (event.clientY - drag.current.y) / event.currentTarget.getBoundingClientRect().height)),
            });
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onLostPointerCapture={() => { drag.current = null; }}
        />
        {variant === "logo" ? <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-2 border-white" style={{ boxShadow: "0 0 0 100px rgb(0 0 0 / 45%)" }} /> : <div aria-hidden className="pointer-events-none absolute inset-0 rounded-xl border-2 border-white" />}
      </div>
      <fieldset disabled={busy || !ready} className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm">Zoom<input aria-label={variant === "cover" ? "Zoom da capa" : "Zoom da logo"} type="range" min="0.25" max="4" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="min-w-0 flex-1" /></label>
        <button type="button" className="min-h-9 text-xs text-text-soft hover:text-text" onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}>Redefinir ajuste</button>
      </fieldset>
      {(error || uploadError) && <p role="alert" className="mt-2 text-sm text-no">{error || uploadError}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={busy} onClick={onCancel} className="min-h-12 flex-1 rounded-btn border border-line text-sm disabled:opacity-60">Cancelar</button>
        <button type="button" disabled={busy || !ready} onClick={() => void save()} className="min-h-12 flex-1 rounded-btn bg-ink px-3 text-sm font-semibold text-ink-text disabled:opacity-60">{busy ? "Salvando…" : variant === "cover" ? "Aplicar capa" : "Salvar logo"}</button>
      </div>
    </dialog>
  );
}
