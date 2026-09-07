"use client";

import { useState, type ReactNode } from "react";
import {
  clearPlayerIdentity,
  createPlayerIdentity,
  writePlayerIdentity,
} from "../identity/player-identity";
import { usePlayerIdentity } from "../hooks/use-player-identity";
import { useSession } from "../hooks/use-session";
import { readyButtonLabel, readyConfirmCopy } from "../model/session-copy";
import type { GameMode } from "../model/session";
import { isSessionEmpty } from "../model/session-view";
import { AssignmentScreen } from "./assignment-screen";
import { NameScreen } from "./name-screen";
import { PlayDockPair, PlayShell } from "./play-dock";
import { PlayNav } from "./play-nav";
import { SessionGate } from "./session-gate";
import { SessionSummary } from "./session-summary";
import { SessionTicker } from "./session-ticker";
import { SetupWizard } from "./setup-wizard";
import { WaitingScreen } from "./waiting-screen";

export function PlayApp() {
  const identity = usePlayerIdentity();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [claimable, setClaimable] = useState(false);
  const [claimName, setClaimName] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [awaitingPin, setAwaitingPin] = useState(false);
  const session = useSession(identity?.token ?? null);

  async function persistJoin(
    token: string,
    result: Awaited<ReturnType<typeof session.join>>,
  ) {
    if (result.ok && "me" in result.body && result.body.me) {
      writePlayerIdentity({
        version: 2,
        token,
        name: result.body.me.name,
      });
      setClaimable(false);
      setClaimName(null);
      setJoining(false);
      setJoinName("");
    }
  }

  async function joinWithName(name: string) {
    const next = identity ?? createPlayerIdentity(name);
    const result = await session.join(next.token, name, true);
    const error =
      typeof result.body === "object" && result.body && "error" in result.body
        ? result.body.error
        : null;
    setClaimable(error === "name_unclaimed");
    setClaimName(error === "name_unclaimed" ? name.trim() : null);
    await persistJoin(next.token, result);
  }

  async function handleJoin(name: string) {
    setBusy(true);
    try {
      await joinWithName(name);
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim(name: string) {
    setBusy(true);
    try {
      const next = identity ?? createPlayerIdentity(name);
      const result = await session.claim(next.token, name);
      await persistJoin(next.token, result);
    } finally {
      setBusy(false);
    }
  }

  async function handleWizardFinish(draft: {
    name: string;
    gameMode: GameMode;
    courtCount: number;
  }) {
    setBusy(true);
    try {
      const settings = await session.saveSettings({
        gameMode: draft.gameMode,
        courtCount: draft.courtCount,
      });
      if (!settings.ok) {
        return;
      }
      await joinWithName(draft.name);
    } finally {
      setBusy(false);
    }
  }

  async function handleStartNew() {
    if (
      !window.confirm(
        "This clears everyone on the board. Start a new session?",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      if (session.view?.settings.pinEnabled && !session.view.settings.unlocked) {
        setAwaitingPin(true);
        return;
      }
      await session.reset();
      setJoining(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock(pin: string) {
    setBusy(true);
    try {
      const result = await session.unlockPin(pin);
      if (!result.ok) {
        return;
      }
      if (awaitingPin) {
        await session.reset();
        setJoining(false);
        setAwaitingPin(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReady() {
    if (!identity) {
      return;
    }
    setBusy(true);
    try {
      await session.ready(identity.token);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDone() {
    if (!identity) {
      return;
    }
    setBusy(true);
    try {
      await session.done({ token: identity.token });
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!identity) {
      return;
    }
    setBusy(true);
    try {
      const result = await session.leave(identity.token);
      const error =
        typeof result.body === "object" &&
        result.body &&
        "error" in result.body
          ? result.body.error
          : null;
      if (result.ok || error === "player_not_found") {
        clearPlayerIdentity();
        setConfirming(false);
        setJoining(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const me = session.view?.me;
  const view = session.view;
  const inPool = Boolean(identity && me);
  const showSummary = inPool && Boolean(view);
  const empty = view ? isSessionEmpty(view) : false;
  let dock: ReactNode = null;

  if (me?.status === "on_court") {
    dock = (
      <button
        type="button"
        className="play-primary"
        disabled={busy}
        onClick={() => void handleDone()}
      >
        I&apos;m done
      </button>
    );
  } else if (inPool && view) {
    dock = confirming ? (
      <div className="play-dock-stack">
        <p className="play-lede">
          {readyConfirmCopy(view.settings.readyRule, "phone")}
        </p>
        <PlayDockPair
          leading={
            <button
              type="button"
              className="play-secondary"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          }
          action={
            <button
              type="button"
              className="play-primary"
              disabled={busy}
              onClick={() => void handleReady()}
            >
              Yes, players ready
            </button>
          }
        />
      </div>
    ) : (
      <PlayDockPair
        leading={
          <button
            type="button"
            className="play-secondary"
            disabled={busy}
            onClick={() => void handleLeave()}
          >
            Leave
          </button>
        }
        action={
          <button
            type="button"
            className="play-primary"
            disabled={busy || !view.canStart}
            onClick={() => setConfirming(true)}
          >
            {readyButtonLabel(view)}
          </button>
        }
      />
    );
  }

  let main: ReactNode;
  if (session.loading && !view) {
    main = <p className="play-lede">Loading…</p>;
  } else if (!view) {
    main = <p className="play-lede">{session.notice ?? "Could not load the pool."}</p>;
  } else if (inPool && me?.status === "on_court") {
    main = (
      <div className="play-desktop-grid">
        <AssignmentScreen me={me} notice={session.notice} />
        {showSummary ? <SessionSummary view={view} /> : null}
      </div>
    );
  } else if (inPool) {
    main = (
      <div className="play-desktop-grid">
        <WaitingScreen view={view} notice={session.notice} />
        {showSummary ? <SessionSummary view={view} /> : null}
      </div>
    );
  } else if (empty) {
    main = (
      <div className="play-join-wrap">
        <SetupWizard
          view={view}
          notice={session.notice}
          busy={busy}
          onFinish={handleWizardFinish}
          onUnlock={handleUnlock}
        />
      </div>
    );
  } else if (joining) {
    main = (
      <div className="play-join-wrap">
        <NameScreen
          notice={session.notice}
          busy={busy}
          claimable={claimable}
          claimName={claimName}
          initialName={joinName}
          onBack={() => setJoining(false)}
          onNameChange={setJoinName}
          onJoin={handleJoin}
          onClaim={handleClaim}
        />
      </div>
    );
  } else {
    main = (
      <div className="play-join-wrap">
        <SessionGate
          notice={session.notice}
          busy={busy}
          awaitingPin={awaitingPin}
          onJoin={() => setJoining(true)}
          onStartNew={() => void handleStartNew()}
          onUnlock={handleUnlock}
        />
      </div>
    );
  }

  return (
    <PlayShell dock={dock}>
      <PlayNav />
      <main className="play-main">{main}</main>
      {view ? <SessionTicker view={view} /> : null}
    </PlayShell>
  );
}
