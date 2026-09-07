"use client";

import { useState, type FormEvent } from "react";

export const PIN_UNLOCK_FORM_ID = "pin-unlock-form";

export function PinUnlockField({
  busy,
  notice,
  onUnlock,
  showSubmit = true,
}: {
  busy: boolean;
  notice: string | null;
  onUnlock: (pin: string) => Promise<void>;
  showSubmit?: boolean;
}) {
  const [pin, setPin] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onUnlock(pin);
  }

  return (
    <form id={PIN_UNLOCK_FORM_ID} className="play-form" onSubmit={handleSubmit}>
      <p className="play-lede">Unlock Settings with the club PIN first.</p>
      <label className="scoreboard-label" htmlFor="wizard-unlock-pin">
        Club PIN
      </label>
      <input
        id="wizard-unlock-pin"
        inputMode="numeric"
        autoComplete="off"
        value={pin}
        onChange={(event) => setPin(event.target.value)}
      />
      {notice ? (
        <p className="play-notice" role="status" aria-live="polite">
          {notice}
        </p>
      ) : null}
      {showSubmit ? (
        <button type="submit" className="play-primary" disabled={busy}>
          Unlock
        </button>
      ) : null}
    </form>
  );
}
