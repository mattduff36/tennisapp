export function TennisBall({
  className,
  title = "Tennis ball",
  decorative = false,
}: {
  className?: string;
  title?: string;
  decorative?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      <circle cx="32" cy="32" r="28" fill="var(--ball)" />
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="var(--ball-shadow)"
        strokeWidth="2"
        opacity="0.35"
      />
      <path
        d="M14 18c8 6 10 16 10 28M50 18c-8 6-10 16-10 28"
        fill="none"
        stroke="var(--ball-seam)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
