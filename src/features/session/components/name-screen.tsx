"use client";

import { useState, type FormEvent } from "react";
import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";

export function NameScreen({
  notice,
  busy,
  onJoin,
}: {
  notice: string | null;
  busy: boolean;
  onJoin: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onJoin(name);
  }

  return (
    <section className="play-card">
      <div className="play-brand">
        <TennisBall className="play-brand-ball" />
        <p className="scoreboard-label">Club session</p>
      </div>
      <h1 className="play-title">What is your name?</h1>
      <form className="play-form" onSubmit={handleSubmit}>
        <label className="scoreboard-label" htmlFor="player-name">
          Your name
        </label>
        <input
          id="player-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="nickname"
          autoCapitalize="words"
          maxLength={40}
          placeholder="e.g. Ada"
        />
        {notice ? <p className="play-notice">{notice}</p> : null}
        <button type="submit" className="play-primary" disabled={busy}>
          Join the pool
        </button>
      </form>
    </section>
  );
}
