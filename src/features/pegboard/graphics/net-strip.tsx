export function NetStrip({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 24"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <rect x="0" y="4" width="240" height="16" fill="var(--net-fill)" />
      {Array.from({ length: 25 }, (_, index) => (
        <line
          key={index}
          x1={index * 10}
          y1="4"
          x2={index * 10}
          y2="20"
          stroke="var(--line)"
          strokeWidth="1"
          opacity="0.55"
        />
      ))}
      <line
        x1="0"
        y1="4"
        x2="240"
        y2="4"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <line
        x1="0"
        y1="20"
        x2="240"
        y2="20"
        stroke="var(--line)"
        strokeWidth="2"
      />
    </svg>
  );
}
