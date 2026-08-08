export function TextSizeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <text
        x="2"
        y="17"
        fill="currentColor"
        fontFamily="var(--font-ui), sans-serif"
        fontSize="11"
        fontWeight="700"
      >
        A
      </text>
      <text
        x="11"
        y="18"
        fill="currentColor"
        fontFamily="var(--font-ui), sans-serif"
        fontSize="16"
        fontWeight="700"
      >
        A
      </text>
    </svg>
  );
}
