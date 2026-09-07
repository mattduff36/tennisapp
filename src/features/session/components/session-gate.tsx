import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";
import { PinUnlockField } from "./pin-unlock-field";

export function SessionGate({
  notice,
  busy,
  awaitingPin,
  onJoin,
  onStartNew,
  onUnlock,
}: {
  notice: string | null;
  busy: boolean;
  awaitingPin: boolean;
  onJoin: () => void;
  onStartNew: () => void;
  onUnlock: (pin: string) => Promise<void>;
}) {
  return (
    <section className="play-card">
      <div className="play-brand">
        <TennisBall className="play-brand-ball" />
        <p className="scoreboard-label">Club session</p>
      </div>
      <h1 className="play-title">Session is on</h1>
      <p className="play-lede">Join the pool, or start a new session and clear the board.</p>
      {notice && !awaitingPin ? (
        <p className="play-notice" role="status" aria-live="polite">
          {notice}
        </p>
      ) : null}
      {awaitingPin ? (
        <PinUnlockField busy={busy} notice={notice} onUnlock={onUnlock} />
      ) : (
        <div className="play-form">
          <button
            type="button"
            className="play-primary"
            disabled={busy}
            onClick={onJoin}
          >
            Join this session
          </button>
          <button
            type="button"
            className="play-secondary"
            disabled={busy}
            onClick={onStartNew}
          >
            Start a new session
          </button>
        </div>
      )}
    </section>
  );
}
