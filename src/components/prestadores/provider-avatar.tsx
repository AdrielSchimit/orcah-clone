type ProviderAvatarProps = {
  name: string;
  logoPath?: string | null;
  coverPath?: string | null;
  className?: string;
};

export function ProviderAvatar({ name, logoPath, coverPath, className = "" }: ProviderAvatarProps) {
  const src = logoPath || coverPath;
  const initial = name.slice(0, 1).toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`object-cover ${className}`} loading="lazy" />
    );
  }

  return (
    <span
      aria-hidden
      className={`flex items-center justify-center bg-brand-wash text-lg font-semibold text-ink ${className}`}
    >
      {initial}
    </span>
  );
}
