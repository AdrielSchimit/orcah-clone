import Image, { type StaticImageData } from "next/image";
import atencao from "@/assets/mascote/atencao.webp";
import avatar from "@/assets/mascote/avatar.webp";
import boasVindas from "@/assets/mascote/boas-vindas.webp";
import dicas from "@/assets/mascote/dicas.webp";
import explicando from "@/assets/mascote/explicando.webp";
import pensando from "@/assets/mascote/pensando.webp";
import sucesso from "@/assets/mascote/sucesso.webp";
import trabalhando from "@/assets/mascote/trabalhando.webp";

export type MascotePose =
  | "boas-vindas"
  | "explicando"
  | "pensando"
  | "trabalhando"
  | "sucesso"
  | "atencao"
  | "dicas";

const poses: Record<MascotePose, StaticImageData> = {
  "boas-vindas": boasVindas,
  explicando,
  pensando,
  trabalhando,
  sucesso,
  atencao,
  dicas,
};

export function Mascote({
  pose,
  className = "h-40 w-auto",
  priority = false,
}: {
  pose: MascotePose;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={poses[pose]}
      alt=""
      className={`select-none object-contain ${className}`}
      priority={priority}
      draggable={false}
    />
  );
}

export function MascoteAvatar({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <Image
      src={avatar}
      alt=""
      className={`select-none rounded-full bg-gold-wash object-cover ${className}`}
      draggable={false}
    />
  );
}

/** Estado vazio: mascote + balão de fala, como nas telas de referência. */
export function MascoteVazio({
  pose,
  children,
  action,
}: {
  pose: MascotePose;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-6 flex items-end gap-2">
      <Mascote pose={pose} className="h-36 w-auto shrink-0 animate-rise md:h-44" />
      <div className="relative mb-12 min-w-0 flex-1 animate-pop rounded-box border border-gold/40 bg-gold-wash px-4 py-3 text-sm font-semibold text-text shadow-card">
        <span
          aria-hidden
          className="absolute -left-2 bottom-4 h-4 w-4 rotate-45 border-b border-l border-gold/40 bg-gold-wash"
        />
        <div className="relative">{children}</div>
        {action ? <div className="relative mt-2 font-medium">{action}</div> : null}
      </div>
    </div>
  );
}
