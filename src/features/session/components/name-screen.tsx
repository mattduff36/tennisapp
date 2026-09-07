"use client";

import { useState, type FormEvent } from "react";
import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";

export function NameScreen({
  notice,
  busy,
  claimable,
  submitLabel = "Join the pool",
  onJoin,
  onClaim,
}: {
  notice: string | null;
  busy: boolean;
  claimable: boolean;
  submitLabel?: string;
  onJoin: (name: string) => Promise<void>;
  onClaim: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [emptyError, setEmptyError] = useState(false);
  const errorId = "player-name-error";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setEmptyError(true);
      return;
    }
    setEmptyError(false);
    await onJoin(name);
  }

  return (
    <section className="play-card">
      <div className="play-brand">
        <TennisBall className="play-brand-ball" />
        <p className="scoreboard-label">Club session</p>
      </div>
      <h1 className="play-title">
        {claimable ? "Is that you?" : "What is your name?"}
      </h1>
      <form className="play-form" onSubmit={handleSubmit}>
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
            setName(event.target.value);
            if (emptyError && event.target.value.trim()) {
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
        {claimable ? (
          <p className="play-lede">That name is on the board. Claim it if it is you.</p>
        ) : null}
        <button type="submit" className="play-primary" disabled={busy}>
          {submitLabel}
        </button>
        {claimable ? (
          <button
            type="button"
            className="play-secondary"
            disabled={busy}
            onClick={() => void onClaim(name)}
          >
            Claim this name
          </button>
        ) : null}
      </form>
    </section>
  );
}
