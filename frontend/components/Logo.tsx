type LogoVariant = "principal" | "lima" | "invertido";

interface LogoProps {
  size?: number;
  /**
   * principal: cuadro verde con la figura oscura (pantallas de autenticación).
   * lima: cuadro lima con la figura verde profundo (barra lateral).
   * invertido: cuadro verde con la figura lima.
   */
  variant?: LogoVariant;
  className?: string;
}

const COLORES: Record<LogoVariant, { fondo: string; figura: string }> = {
  principal: { fondo: "#1E6B52", figura: "#0B231B" },
  lima: { fondo: "#C6DE73", figura: "#12392C" },
  invertido: { fondo: "#1E6B52", figura: "#C6DE73" },
};

/** Logo de RootSearch: estudiante con birrete sobre un libro abierto. */
export default function Logo({ size = 36, variant = "lima", className }: LogoProps) {
  const { fondo, figura } = COLORES[variant];

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="RootSearch"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill={fondo} />
      <g transform="translate(32 32) scale(0.7) translate(-32 -36)" fill={figura}>
        {/* Birrete */}
        <path d="M12 18 32 11 52 18 32 25Z" />
        {/* Cabello y hombros, con la cara recortada */}
        <path
          fillRule="evenodd"
          d="M20.5 23.5Q32 28 43.5 23.5L44.5 31Q46 39 49 45L32 50.5 15 45Q18 39 19.5 31Z M24.5 29.5Q32 27.5 39.5 29.5Q39.5 38 32 43.5Q24.5 38 24.5 29.5Z"
        />
        {/* Libro abierto */}
        <path d="M13 48 32 54 51 48V51.5Q42 58.5 32 61 22 58.5 13 51.5Z" />
        {/* Borla */}
        <path d="M45.3 27.5 47 32 48.7 27.5Z" />
        <path d="M46.2 19.2H47.8V28H46.2Z" />
      </g>
    </svg>
  );
}
