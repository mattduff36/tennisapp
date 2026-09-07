"use client";

import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";
import { useState, type FormEvent } from "react";
import { PlayDockFill, PlayDockPair } from "./play-dock";

export const PLAYER_NAME_FORM_ID = "player-name-form";

export function NameScreen({
  notice,
  busy,
  claimable,
  claimName = null,
  initialName = "",
  submitLabel = "Join the pool",
  onBack,
  onNameChange,
  onJoin,
  onClaim,
}: {
  notice: string | null;
  busy: boolean;
  claimable: boolean;
  claimName?: string | null;
  initialName?: string;
  submitLabel?: string;
  onBack?: () => void;
  onNameChange?: (name: string) => void;
  onJoin: (name: string) => Promise<void>;
  onClaim: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [emptyError, setEmptyError] = useState(false);
  const errorId = "player-name-error";
  const canClaim = Boolean(claimable && claimName && name.trim() === claimName);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setEmptyError(true);
      return;
    }
    setEmptyError(false);
    if (canClaim) {
      await onClaim(name);
      return;
    }
    await onJoin(name);
  }

  const backButton = onBack ? (
    <button
      type="button"
      className="play-secondary"
      disabled={busy}
      onClick={onBack}
    >
      Back
    </button>
  ) : null;

  const joinButton = (
    <button
      type="submit"
      form={PLAYER_NAME_FORM_ID}
      className={canClaim ? "play-secondary" : "play-primary"}
      disabled={busy}
    >
      {submitLabel}
    </button>
  );

  const claimButton = (
    <button
      type="submit"
      form={PLAYER_NAME_FORM_ID}
      className="play-primary"
      disabled={busy}
    >
      Claim this name
    </button>
  );

  return (
    <section className="play-card">
      <div className="play-brand">
        <TennisBall className="play-brand-ball" />
        <p className="scoreboard-label">Club session</p>
      </div>
      <h1 className="play-title">
        {canClaim ? "Is that you?" : "What is your name?"}
      </h1>
      <form id={PLAYER_NAME_FORM_ID} className="play-form" onSubmit={handleSubmit}>
        <label className="scoreboard-label" htmlFor="player-name">
          Your name
        </label>
        <input
          id="player-name"
          name="name"
          value={name}
          required
          aria-invalid={emptyError || undefined}
          aria-describedby={emptyError ? errorId : undefined}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            onNameChange?.(next);
            if (emptyError && next.trim()) {
              setEmptyError(false);
            }
          }}
          autoComplete="nickname"
          autoCapitalize="words"
          maxLength={40}
          placeholder="e.g. Ada"
        />
        {emptyError ? (
          <p id={errorId} className="play-notice" role="alert">
            Enter a name to continue.
          </p>
        ) : null}
        {notice ? (
          <p className="play-notice" role="status" aria-live="polite">
            {notice}
          </p>
        ) : null}
        {canClaim ? (
          <p className="play-lede">That name is on the board. Claim it if it is you.</p>
        ) : null}
      </form>
      <PlayDockFill>
        {canClaim && backButton ? (
          <PlayDockPair leading={backButton} action={claimButton} />
        ) : canClaim ? (
          <PlayDockPair leading={joinButton} action={claimButton} />
        ) : backButton ? (
          <PlayDockPair leading={backButton} action={joinButton} />
        ) : (
          joinButton
        )}
      </PlayDockFill>
    </section>
  );
}
