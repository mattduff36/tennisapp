"use client";

import { useState } from "react";
import {
  clearPlayerIdentity,
  createPlayerIdentity,
  writePlayerIdentity,
} from "../identity/player-identity";
import { usePlayerIdentity } from "../hooks/use-player-identity";
import { useSession } from "../hooks/use-session";
import { AssignmentScreen } from "./assignment-screen";
import { NameScreen } from "./name-screen";
import { PlayNav } from "./play-nav";
import { WaitingScreen } from "./waiting-screen";

export function PlayApp() {
  const identity = usePlayerIdentity();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const session = useSession(identity?.token ?? null);

  async function handleJoin(name: string) {
    setBusy(true);
    try {
      const next = identity ?? createPlayerIdentity(name);
      const result = await session.join(next.token, name);
      if (result.ok && "me" in result.body && result.body.me) {
        writePlayerIdentity({
          version: 2,
          token: next.token,
          name: result.body.me.name,
        });
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
      }
    } finally {
      setBusy(false);
    }
  }

  const me = session.view?.me;

  return (
    <div className="play-shell">
      <main className="play-main">
        {session.loading && !session.view ? (
          <p className="play-lede">Loading…</p>
        ) : !identity ? (
          <NameScreen notice={session.notice} busy={busy} onJoin={handleJoin} />
        ) : me?.status === "on_court" ? (
          <AssignmentScreen
            me={me}
            notice={session.notice}
            busy={busy}
            onDone={handleDone}
          />
        ) : session.view ? (
          <WaitingScreen
            view={session.view}
            notice={session.notice}
            confirming={confirming}
            busy={busy}
            onConfirmReady={() => setConfirming(true)}
            onCancelConfirm={() => setConfirming(false)}
            onReady={handleReady}
            onLeave={handleLeave}
          />
        ) : (
          <p className="play-lede">{session.notice ?? "Could not load the pool."}</p>
        )}
      </main>
      <PlayNav />
    </div>
  );
}
