import { resolveServiceCoverTheme, serviceCoverIcons } from "@/lib/service-cover-themes";

// Positions in the shared 1500 × 500 canvas. The left/center remains quiet.
const placements = [
  { x: 1160, y: 48, size: 180, angle: -14, opacity: 0.42 },
  { x: 1410, y: 65, size: 145, angle: 14, opacity: 0.32 },
  { x: 1310, y: 300, size: 180, angle: 10, opacity: 0.38 },
  { x: -55, y: 365, size: 150, angle: -18, opacity: 0.2 },
];

/** Decorative, deterministic SVG: no images, requests, effects or client directive. */
export function ServiceCoverPlaceholder({ category, className = "" }: {
  category?: string | null;
  className?: string;
}) {
  const theme = resolveServiceCoverTheme(category);
  return (
    <div aria-hidden="true" className={`pointer-events-none relative aspect-[3/1] w-full overflow-hidden ${className}`} style={{ backgroundColor: theme.background, color: theme.accent }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1500 500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        {theme.icons.map((icon, index) => {
          const placement = placements[index % placements.length];
          return (
            <g key={`${icon}-${index}`} opacity={placement.opacity} transform={`translate(${placement.x} ${placement.y}) scale(${placement.size / 100}) rotate(${placement.angle} 50 50)`}>
              {serviceCoverIcons[icon].map((d, i) => <path key={i} d={d} />)}
            </g>
          );
        })}
        <g opacity="0.18" strokeWidth="2">
          {theme.pattern.map((d, index) => <path key={index} d={d} />)}
        </g>
      </svg>
    </div>
  );
}
