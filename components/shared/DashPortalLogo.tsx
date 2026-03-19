import Image from "next/image";

interface DashPortalLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const SIZES = {
  sm: { img: 24, text: "text-sm" },
  md: { img: 32, text: "text-lg" },
  lg: { img: 40, text: "text-xl" },
};

/**
 * DashPortal logo component — gebruikt het echte logo bestand.
 * Gebruik dit overal waar het DashPortal merk getoond wordt.
 */
export function DashPortalLogo({ size = "md", showText = true, className = "" }: DashPortalLogoProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/favicon-dashportal.png"
        alt="DashPortal"
        width={s.img}
        height={s.img}
        className="shrink-0"
      />
      {showText && (
        <Image
          src="/logo-dashportal.png"
          alt="DashPortal"
          width={s.img * 4.5}
          height={s.img}
          className="h-auto shrink-0"
          style={{ maxHeight: s.img }}
        />
      )}
    </span>
  );
}

/**
 * Alleen het favicon/icoon — voor compacte plekken.
 */
export function DashPortalIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/favicon-dashportal.png"
      alt="DashPortal"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  );
}
