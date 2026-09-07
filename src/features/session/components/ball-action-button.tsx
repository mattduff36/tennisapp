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
      onClick={onClick}
    >
      <TennisBall className="play-ball-action-icon" decorative />
      <span>{label}</span>
    </button>
  );
}
