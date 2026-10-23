/* eslint-disable @next/next/no-img-element */
// <img> normal: las fotos vienen del dominio de WordPress/Dropi. Pasar a
// next/image exige declarar ese dominio en images.remotePatterns.

export function ProductImage({
  src,
  name,
  id,
  className = "",
  priority = false,
}: {
  src?: string;
  name: string;
  id: number;
  className?: string;
  priority?: boolean; // foto principal de la ficha (LCP): sin lazy y con prioridad alta
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  // Sin foto: degradado con un tono estable por producto y sus iniciales.
  const hue = (id * 47) % 360;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex h-full w-full items-center justify-center font-display text-4xl font-black text-ink/30 ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, oklch(0.95 0.06 ${hue}), oklch(0.86 0.09 ${(hue + 40) % 360}))`,
      }}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  );
}
