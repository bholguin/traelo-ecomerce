/* eslint-disable @next/next/no-img-element */
// <img> normal a propósito: next/image optimiza en el servidor y esa URL
// no estaría disponible sin conexión. El service worker cachea las fotos.

const TONES = ["#F4D9C6", "#D6E4D3", "#D9DDF0", "#F1E3B8", "#E7D3E6", "#CFE5E8"];

export function ProductImage({
  src,
  name,
  id,
  className = "",
}: {
  src?: string;
  name: string;
  id: number;
  className?: string;
}) {
  if (src) {
    return <img src={src} alt={name} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex h-full w-full items-center justify-center text-3xl font-bold text-ink/40 ${className}`}
      style={{ background: TONES[id % TONES.length] }}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  );
}
