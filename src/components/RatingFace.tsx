export const ratingLabels = ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"];

export function RatingFace({ value, size = 64 }: { value: number; size?: number }) {
  // Cores de fundo e detalhes táteis inspirados no Design System Stitch (Tactile Humanism)
  const faceConfigs = [
    {
      // 1: Péssimo
      bgOpacity: 0.14,
      brows: (
        <>
          <path d="M16 19 L25 23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M40 19 L31 23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ),
      eyes: (
        <>
          <circle cx="20" cy="27" r="3" fill="currentColor" />
          <circle cx="36" cy="27" r="3" fill="currentColor" />
        </>
      ),
      mouth: (
        <path
          d="M18 42 Q28 30 38 42"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      ),
    },
    {
      // 2: Ruim
      bgOpacity: 0.12,
      brows: (
        <>
          <path d="M17 21 L24 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M39 21 L32 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ),
      eyes: (
        <>
          <circle cx="20" cy="27" r="2.8" fill="currentColor" />
          <circle cx="36" cy="27" r="2.8" fill="currentColor" />
        </>
      ),
      mouth: (
        <path
          d="M19 39 Q28 32 37 39"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ),
    },
    {
      // 3: Regular
      bgOpacity: 0.12,
      brows: null,
      eyes: (
        <>
          <circle cx="20" cy="26" r="2.8" fill="currentColor" />
          <circle cx="36" cy="26" r="2.8" fill="currentColor" />
        </>
      ),
      mouth: (
        <path
          d="M20 37 L36 37"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ),
    },
    {
      // 4: Bom
      bgOpacity: 0.12,
      brows: null,
      eyes: (
        <>
          <circle cx="20" cy="25" r="2.8" fill="currentColor" />
          <circle cx="36" cy="25" r="2.8" fill="currentColor" />
        </>
      ),
      mouth: (
        <path
          d="M18 35 Q28 44 38 35"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ),
    },
    {
      // 5: Excelente
      bgOpacity: 0.15,
      brows: null,
      eyes: (
        <>
          {/* Olhinhos felizes curvados */}
          <path
            d="M16 26 Q20 20 24 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M32 26 Q36 20 40 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ),
      mouth: (
        <path
          d="M17 33 Q28 48 39 33 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      ),
    },
  ];

  const config = faceConfigs[Math.max(0, Math.min(4, value - 1))];

  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      className={`rating-face face-${value}`}
      aria-hidden="true"
    >
      {/* Círculo com leve preenchimento tátil e borda elegante */}
      <circle cx="28" cy="28" r="25" fill="currentColor" fillOpacity={config.bgOpacity} />
      <circle cx="28" cy="28" r="25" fill="none" stroke="currentColor" strokeWidth="2.2" />
      {config.brows}
      {config.eyes}
      {config.mouth}
    </svg>
  );
}

