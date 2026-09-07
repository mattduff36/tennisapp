"use client";

import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";
import { useState, type ReactNode } from "react";
import {
  MAX_COURT_COUNT,
  MIN_COURT_COUNT,
  type GameMode,
} from "../model/session";
import { wizardSetupSummary } from "../model/session-copy";
import type { SessionView } from "../model/session-view";
import { NameScreen } from "./name-screen";
import { PIN_UNLOCK_FORM_ID, PinUnlockField } from "./pin-unlock-field";
import { PlayDockFill, PlayDockPair } from "./play-dock";

type WizardStep = 1 | 2 | 3 | 4 | 5;

export function SetupWizard({
  view,
  notice,
  busy,
  onFinish,
  onUnlock,
}: {
  view: SessionView;
  notice: string | null;
  busy: boolean;
  onFinish: (draft: {
    name: string;
    gameMode: GameMode;
    courtCount: number;
  }) => Promise<void>;
  onUnlock: (pin: string) => Promise<void>;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>(view.settings.gameMode);
  const [courtCount, setCourtCount] = useState(view.settings.courtCount);
  const locked = view.settings.pinEnabled && !view.settings.unlocked;
  const canFinish = !busy && name.trim().length > 0;

  let dock: ReactNode = null;
  if (step === 1) {
    dock = (
      <button
        type="button"
        className="play-primary play-cta-hero"
        disabled={busy}
        onClick={() => setStep(2)}
      >
        Start session
      </button>
    );
  } else if (step === 3) {
    dock = (
      <WizardNav busy={busy} onBack={() => setStep(2)} onNext={() => setStep(4)} />
    );
  } else if (step === 4) {
    dock = (
      <WizardNav busy={busy} onBack={() => setStep(3)} onNext={() => setStep(5)} />
    );
  } else if (step === 5) {
    dock = (
      <PlayDockPair
        leading={
          <button
            type="button"
            className="play-secondary"
            disabled={busy}
            onClick={() => setStep(4)}
          >
            Back
          </button>
        }
        action={
          locked ? (
            <button
              type="submit"
              form={PIN_UNLOCK_FORM_ID}
              className="play-primary play-cta-hero"
              disabled={busy}
            >
              Unlock
            </button>
          ) : (
            <button
              type="button"
              className="play-primary play-cta-hero"
              disabled={!canFinish}
              onClick={() => void onFinish({ name, gameMode, courtCount })}
            >
              Let&apos;s play!
            </button>
          )
        }
      />
    );
  }

  return (
    <div className={step === 1 || step === 5 ? "play-wizard-hero" : undefined}>
      {step === 1 ? (
        <section className="play-card play-wizard-step">
          <TennisBall className="play-welcome-ball" decorative />
          <h1 className="play-title">Welcome</h1>
          {notice ? (
            <p className="play-notice" role="status" aria-live="polite">
              {notice}
            </p>
          ) : null}
          <p className="play-lede">
            Name yourself, pick singles or doubles, then open the pool.
          </p>
        </section>
      ) : null}

      {step === 2 ? (
        <NameScreen
          notice={notice}
          busy={busy}
          claimable={false}
          initialName={name}
          submitLabel="Next"
          onBack={() => setStep(1)}
          onNameChange={setName}
          onJoin={async (nextName) => {
            if (!nextName.trim()) {
              return;
            }
            setName(nextName);
            setStep(3);
          }}
          onClaim={async () => undefined}
        />
      ) : null}

      {step === 3 ? (
        <section className="play-card">
          <p className="scoreboard-label">Club session</p>
          <h1 className="play-title">Singles or doubles?</h1>
          <div className="play-toggle" role="group" aria-label="Singles or doubles">
            <button
              type="button"
              className={gameMode === "singles" ? "play-primary" : "play-secondary"}
              aria-pressed={gameMode === "singles"}
              disabled={busy}
              onClick={() => setGameMode("singles")}
            >
              Singles
            </button>
            <button
              type="button"
              className={gameMode === "doubles" ? "play-primary" : "play-secondary"}
              aria-pressed={gameMode === "doubles"}
              disabled={busy}
              onClick={() => setGameMode("doubles")}
            >
              Doubles
            </button>
          </div>
          <p className="play-lede">
            {gameMode === "singles" ? "2" : "4"} players per court
          </p>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="play-card">
          <p className="scoreboard-label">Club session</p>
          <h1 className="play-title">How many courts?</h1>
          <div className="play-count-row">
            <button
              type="button"
              className="play-secondary play-count-button"
              disabled={busy || courtCount <= MIN_COURT_COUNT}
              onClick={() => setCourtCount((count) => count - 1)}
            >
              −
            </button>
            <p className="play-count-value" aria-live="polite">
              {courtCount}
            </p>
            <button
              type="button"
              className="play-secondary play-count-button"
              disabled={busy || courtCount >= MAX_COURT_COUNT}
              onClick={() => setCourtCount((count) => count + 1)}
            >
              +
            </button>
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="play-card play-wizard-step">
          <h1 className="play-title">{locked ? "Unlock" : "Ready"}</h1>
          {notice && !locked ? (
            <p className="play-notice" role="status" aria-live="polite">
              {notice}
            </p>
          ) : null}
          {locked ? (
            <PinUnlockField
              busy={busy}
              notice={notice}
              onUnlock={onUnlock}
              showSubmit={false}
            />
          ) : (
            <ul className="play-ready-recap">
              {wizardSetupSummary({ name, gameMode, courtCount }).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {dock ? <PlayDockFill>{dock}</PlayDockFill> : null}
    </div>
  );
}

function WizardNav({
  busy,
  onBack,
  onNext,
}: {
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <PlayDockPair
      leading={
        <button type="button" className="play-secondary" disabled={busy} onClick={onBack}>
          Back
        </button>
      }
      action={
        <button type="button" className="play-primary" disabled={busy} onClick={onNext}>
          Next
        </button>
      }
    />
  );
}
