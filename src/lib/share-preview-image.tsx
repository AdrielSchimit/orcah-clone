import type { SharePreview } from "@/lib/share-preview";

/** Mesmo conteúdo do card, no formato que o Instagram e o WhatsApp leem (1200×630). */
export function sharePreviewImage(preview: SharePreview) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0b1120",
        color: "#ffffff",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", width: 120, height: 10, background: "#ffb020", borderRadius: 99 }} />
      {preview.eyebrow ? (
        <div style={{ display: "flex", marginTop: 36, fontSize: 28, color: "#ffb020" }}>{preview.eyebrow}</div>
      ) : null}
      <div style={{ display: "flex", marginTop: 18, fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>{preview.title}</div>
      <div style={{ display: "flex", marginTop: 28, fontSize: 32, lineHeight: 1.35, color: "#d6d3c9" }}>{preview.description}</div>
      <div style={{ display: "flex", marginTop: "auto", fontSize: 26, color: "#a8a499" }}>{preview.footer}</div>
    </div>
  );
}
