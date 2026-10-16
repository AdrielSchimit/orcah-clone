"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import styles from "./liquid-dock.module.css";

export type LiquidDockItem = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
};

type Props = {
  items: LiquidDockItem[];
  activeId: string;
  onPreviewSelect?: (id: string) => void;
  ariaLabel?: string;
  accent?: string;
  soundEnabled?: boolean;
};

let context: AudioContext | null = null;

/** Gentle, user-gesture-only navigation feedback. Never autoplay. */
function playNavigationSound(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    context ??= new window.AudioContext();
    if (context.state === "suspended") void context.resume();
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(610, start);
    oscillator.frequency.exponentialRampToValueAtTime(435, start + .075);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(.018, start + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + .095);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + .1);
  } catch {
    // Audio may be blocked on some browsers. Navigation must still work.
  }
}

/**
 * Dock líquido reutilizável: a mesma peça aparece no painel mobile e na demo.
 * O destaque é uma única camada animada; as rotas continuam sendo links normais.
 */
export function LiquidDock({ items, activeId, onPreviewSelect, ariaLabel = "Navegação principal", accent = "#ffb020", soundEnabled = true }: Props) {
  const router = useRouter();
  const trackRef = useRef<HTMLElement>(null);
  const pointerRef = useRef<{ id: number; index: number } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId));
  const visualIndex = dragIndex ?? activeIndex;
  const focusedItem = items[visualIndex];

  if (!items.length) return null;

  const cssVars = {
    "--dock-count": items.length,
    "--dock-index": visualIndex,
    "--dock-accent": accent,
  } as CSSProperties;

  function indexAt(clientX: number) {
    const bounds = trackRef.current?.getBoundingClientRect();
    if (!bounds) return activeIndex;
    return Math.min(items.length - 1, Math.max(0, Math.floor(((clientX - bounds.left) / bounds.width) * items.length)));
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const index = indexAt(event.clientX);
    pointerRef.current = { id: event.pointerId, index };
    setDragIndex(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (pointerRef.current?.id !== event.pointerId) return;
    const index = indexAt(event.clientX);
    pointerRef.current.index = index;
    setDragIndex(index);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const gesture = pointerRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragIndex(null);
    const nextItem = items[gesture.index];
    if (!nextItem || nextItem.id === activeId) return;
    playNavigationSound(soundEnabled);
    if (onPreviewSelect) onPreviewSelect(nextItem.id);
    else router.push(nextItem.href);
  }

  function cancelDrag(event: PointerEvent<HTMLDivElement>) {
    if (pointerRef.current?.id !== event.pointerId) return;
    pointerRef.current = null;
    setDragIndex(null);
  }

  return (
    <nav ref={trackRef} className={styles.dock} aria-label={ariaLabel} style={cssVars}>
      <div className={styles.surface} aria-hidden="true" />
      <div className={styles.activeTrack} aria-hidden="true">
        <div className={styles.neck} />
        <div className={styles.orbGlow} />
        <div
          className={dragIndex !== null ? [styles.orb, styles.dragging].join(" ") : styles.orb}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={cancelDrag}
          title="Arraste para trocar de aba"
        >
          <span key={focusedItem.id} className={styles.orbIcon}>
            {focusedItem.icon}
          </span>
        </div>
      </div>
      <ul className={styles.links}>
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className={styles.slot}>
              {onPreviewSelect ? (
                <button
                  type="button"
                  onClick={() => { playNavigationSound(soundEnabled); onPreviewSelect(item.id); }}
                  className={styles.link}
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                >
                  <span className={styles.smallIcon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                  {item.badge ? <span className={styles.badge}>{item.badge > 9 ? "9+" : item.badge}</span> : null}
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => playNavigationSound(soundEnabled)}
                  className={styles.link}
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                >
                  <span className={styles.smallIcon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                  {item.badge ? <span className={styles.badge}>{item.badge > 9 ? "9+" : item.badge}</span> : null}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
