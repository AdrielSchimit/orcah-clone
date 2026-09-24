"use client";

import { useRef } from "react";

export function FilePicker({
  name,
  accept,
  required,
  label,
  hint,
  previewUrl,
  onFile,
}: {
  name?: string;
  accept: string;
  required?: boolean;
  label: string;
  hint?: string;
  previewUrl?: string | null;
  onFile?: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-16 w-full items-center gap-3 rounded-btn border border-dashed border-line bg-paper px-4 py-3 text-left"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-wash text-lg text-gold-deep">
            +
          </span>
        )}
        <span>
          <span className="block text-sm font-medium">{previewUrl ? "Trocar arquivo" : "Toque para enviar"}</span>
          {hint ? <span className="block text-xs text-text-soft">{hint}</span> : null}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required && !previewUrl}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file && onFile) onFile(file);
        }}
      />
    </div>
  );
}
