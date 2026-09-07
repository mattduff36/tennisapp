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
import { AssignmentScreen } from "./assignment-screen";
import { NameScreen } from "./name-screen";
import { PlayDock } from "./play-dock";
import { PlayNav } from "./play-nav";
import { SessionSummary } from "./session-summary";
import { SessionTicker } from "./session-ticker";
import { WaitingScreen } from "./waiting-screen";

export function PlayApp() {
  const identity = usePlayerIdentity();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [claimable, setClaimable] = useState(false);
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
    }
  }

  async function handleJoin(name: string) {
    setBusy(true);
    try {
      const next = identity ?? createPlayerIdentity(name);
      const result = await session.join(next.token, name, true);
      const error =
        typeof result.body === "object" && result.body && "error" in result.body
          ? result.body.error
          : null;
      setClaimable(error === "name_unclaimed");
      await persistJoin(next.token, result);
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
      }
    } finally {
      setBusy(false);
    }
  }

  const me = session.view?.me;
  const view = session.view;
  const showSummary = Boolean(identity && view);
  let dock: ReactNode = null;

  if (identity && me?.status === "on_court") {
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
  } else if (identity && view) {
    dock = confirming ? (
      <div className="play-dock-stack">
            <p className="play-lede">
              {readyConfirmCopy(view.settings.readyRule, "phone")}
            </p>
        <div className="play-button-row">
          <button
            type="button"
            className="play-primary"
            disabled={busy}
            onClick={() => void handleReady()}
          >
            Yes, players ready
          </button>
          <button
            type="button"
            className="play-secondary"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="play-button-row">
        <button
          type="button"
          className="play-primary"
          disabled={busy || !view.canStart}
          onClick={() => setConfirming(true)}
        >
          {readyButtonLabel(view)}
        </button>
        <button
          type="button"
          className="play-secondary"
          disabled={busy}
          onClick={() => void handleLeave()}
        >
          Leave
        </button>
      </div>
    );
  }

  return (
    <div className="play-shell">
      <PlayNav />
      <main className="play-main">
        {session.loading && !view ? (
          <p className="play-lede">Loading…</p>
        ) : !identity ? (
          <NameScreen
            notice={session.notice}
            busy={busy}
            claimable={claimable}
            onJoin={handleJoin}
            onClaim={handleClaim}
          />
        ) : me?.status === "on_court" ? (
          <AssignmentScreen me={me} notice={session.notice} />
        ) : view ? (
          <WaitingScreen view={view} notice={session.notice} />
        ) : (
          <p className="play-lede">{session.notice ?? "Could not load the pool."}</p>
        )}
        {showSummary && view ? <SessionSummary view={view} /> : null}
      </main>
      {view ? <SessionTicker view={view} /> : null}
      {dock ? <PlayDock>{dock}</PlayDock> : null}
    </div>
  );
}
