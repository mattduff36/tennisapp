"use client";

import { useState, type FormEvent } from "react";

export function PlayerManager({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd(name);
    setName("");
  }

  return (
    <form className="player-manager" onSubmit={handleSubmit}>
      <label className="scoreboard-label" htmlFor="new-player-name">
        Add player
      </label>
      <div className="player-manager-row">
        <input
          id="new-player-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Player name"
          autoComplete="off"
          maxLength={40}
          disabled={disabled}
        />
        <button type="submit" className="primary-button" disabled={disabled}>
          Add
        </button>
      </div>
    </form>
  );
}
