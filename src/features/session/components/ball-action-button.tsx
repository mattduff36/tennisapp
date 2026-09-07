import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";

export function BallActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="play-ball-action"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      <TennisBall className="play-ball-action-icon" decorative />
    </button>
  );
}
