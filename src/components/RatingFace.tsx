export const ratingLabels = ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"];
export function RatingFace({ value }: { value: number }) {
  const mouths = [
    "M18 36 Q28 23 38 36",
    "M18 34 Q28 27 38 34",
    "M19 32 L37 32",
    "M18 29 Q28 39 38 29",
    "M17 28 Q28 45 39 28 Z",
  ];
  return (
    <svg viewBox="0 0 56 56" className={`rating-face face-${value}`} aria-hidden="true">
      <circle cx="28" cy="28" r="24" fill="currentColor" fillOpacity=".12" />
      <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="22" r="2" fill="currentColor" />
      <circle cx="36" cy="22" r="2" fill="currentColor" />
      <path
        d={mouths[value - 1]}
        fill={value === 5 ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
