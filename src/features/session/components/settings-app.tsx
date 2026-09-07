"use client";

import { useEffect, useState } from "react";
import { TextSizeControl } from "@/features/pegboard/components/text-size-control";
import { useTextSize } from "@/features/pegboard/hooks/use-text-size";
import { clearLegacyPegboardStorage } from "../identity/clear-legacy-storage";
import { MAX_COURT_COUNT, MIN_COURT_COUNT } from "../model/session";
import { useSession } from "../hooks/use-session";
import { PlayNav } from "./play-nav";
import { SessionTicker } from "./session-ticker";

export function SettingsApp() {
  const session = useSession(null);
  const { textSize, setTextSize } = useTextSize();
  const [busy, setBusy] = useState(false);
  const [courtNames, setCourtNames] = useState<Record<string, string>>({});
  const [unlockPin, setUnlockPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");

  const view = session.view;
  const pinEnabled = view?.settings.pinEnabled ?? false;
  const unlocked = view?.settings.unlocked ?? true;
  const locked = pinEnabled && !unlocked;

  useEffect(() => {
    clearLegacyPegboardStorage();
  }, []);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="play-shell">
      <PlayNav />
      <main className="play-main">
        <section className="play-card">
          <p className="scoreboard-label">
            {locked ? "Unlock with the club PIN" : "Everyone can edit"}
          </p>
          <h1 className="play-title">Settings</h1>
          {session.notice ? <p className="play-notice">{session.notice}</p> : null}
          {!view || session.loading ? (
            <p className="play-lede">Loading…</p>
          ) : (
            <div className="settings-desktop-grid">
              <div className="settings-col">
              <h2 className="play-section-title">Display</h2>
              <p className="play-lede">
                Text size is saved on this device only.
              </p>
              <TextSizeControl textSize={textSize} onChange={setTextSize} />

              {locked ? (
                <>
                  <h2 className="play-section-title">Club PIN</h2>
                  <p className="play-lede">
                    Shared settings stay locked until someone enters the club PIN.
                  </p>
                  <label className="scoreboard-label" htmlFor="unlock-pin">
                    Club PIN
                  </label>
                  <input
                    id="unlock-pin"
                    inputMode="numeric"
                    autoComplete="off"
                    value={unlockPin}
                    onChange={(event) => setUnlockPin(event.target.value)}
                  />
                  <button
                    type="button"
                    className="play-primary"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await session.unlockPin(unlockPin);
                        setUnlockPin("");
                      })
                    }
                  >
                    Unlock
                  </button>
                </>
              ) : (
                <>
                  <h2 className="play-section-title">Game</h2>
                  <div className="play-toggle">
                    <button
                      type="button"
                      className={
                        view.settings.gameMode === "singles"
                          ? "play-primary"
                          : "play-secondary"
                      }
                      disabled={busy || view.courts.some((court) => court.occupied)}
                      onClick={() =>
                        run(() => session.saveSettings({ gameMode: "singles" }))
                      }
                    >
                      Singles
                    </button>
                    <button
                      type="button"
                      className={
                        view.settings.gameMode === "doubles"
                          ? "play-primary"
                          : "play-secondary"
                      }
                      disabled={busy || view.courts.some((court) => court.occupied)}
                      onClick={() =>
                        run(() => session.saveSettings({ gameMode: "doubles" }))
                      }
                    >
                      Doubles
                    </button>
                  </div>
                  <p className="play-lede">
                    {view.settings.gameMode === "singles" ? "2" : "4"} players per court
                  </p>

                  <div className="play-toggle">
                    <button
                      type="button"
                      className={
                        view.settings.readyRule === "longest_wait"
                          ? "play-primary"
                          : "play-secondary"
                      }
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          session.saveSettings({ readyRule: "longest_wait" }),
                        )
                      }
                    >
                      Longest wait
                    </button>
                    <button
                      type="button"
                      className={
                        view.settings.readyRule === "random"
                          ? "play-primary"
                          : "play-secondary"
                      }
                      disabled={busy}
                      onClick={() =>
                        run(() => session.saveSettings({ readyRule: "random" }))
                      }
                    >
                      Random
                    </button>
                  </div>
                  <p className="play-lede">
                    Phone Ready still includes you. Partners and the board group
                    follow this rule.
                  </p>
                </>
              )}
              </div>
              {!locked ? (
                <>
                  <div className="settings-col">
                  <h2 className="play-section-title">Courts</h2>
                  <div className="play-count-row">
                    <button
                      type="button"
                      className="play-secondary play-count-button"
                      disabled={busy || view.settings.courtCount <= MIN_COURT_COUNT}
                      onClick={() =>
                        run(() =>
                          session.saveSettings({
                            courtCount: view.settings.courtCount - 1,
                          }),
                        )
                      }
                    >
                      −
                    </button>
                    <p className="play-count-value">{view.settings.courtCount}</p>
                    <button
                      type="button"
                      className="play-secondary play-count-button"
                      disabled={busy || view.settings.courtCount >= MAX_COURT_COUNT}
                      onClick={() =>
                        run(() =>
                          session.saveSettings({
                            courtCount: view.settings.courtCount + 1,
                          }),
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  {view.courts.map((court) => (
                    <div key={court.id} className="play-edit-row">
                      <label className="scoreboard-label" htmlFor={`court-${court.id}`}>
                        {court.occupied
                          ? `${court.name} · in play`
                          : `${court.name} · free`}
                      </label>
                      <div className="play-edit-controls">
                        <input
                          id={`court-${court.id}`}
                          value={courtNames[court.id] ?? court.name}
                          onChange={(event) =>
                            setCourtNames((current) => ({
                              ...current,
                              [court.id]: event.target.value,
                            }))
                          }
                        />
                        <div className="play-button-row">
                          <button
                            type="button"
                            className="play-secondary"
                            disabled={busy}
                            onClick={() =>
                              run(() =>
                                session.saveSettings({
                                  courts: [
                                    {
                                      id: court.id,
                                      name: courtNames[court.id] ?? court.name,
                                    },
                                  ],
                                }),
                              )
                            }
                          >
                            Save name
                          </button>
                          {court.occupied ? (
                            <button
                              type="button"
                              className="play-secondary"
                              disabled={busy}
                              onClick={() =>
                                run(() => session.done({ courtId: court.id }))
                              }
                            >
                              Clear court
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}

                  </div>
                  <div className="settings-col">
                  <h2 className="play-section-title">Players</h2>
                  {view.waiting.length === 0 &&
                  view.courts.every((court) => court.players.length === 0) ? (
                    <p className="play-lede">Nobody is in the pool.</p>
                  ) : (
                    <>
                      {view.waiting.map((player) => (
                        <PlayerEditor
                          key={`${player.id}-${player.name}`}
                          id={player.id}
                          name={player.name}
                          detail="waiting"
                          busy={busy}
                          onRename={(next) =>
                            run(() => session.renamePlayer(player.id, next))
                          }
                          onRemove={() => run(() => session.removePlayer(player.id))}
                        />
                      ))}
                      {view.courts.flatMap((court) =>
                        court.players.map((player) => (
                          <PlayerEditor
                            key={`${player.id}-${player.name}`}
                            id={player.id}
                            name={player.name}
                            detail={court.name}
                            busy={busy}
                            canRemove={false}
                            onRename={(next) =>
                              run(() => session.renamePlayer(player.id, next))
                            }
                            onRemove={() =>
                              run(() => session.removePlayer(player.id))
                            }
                          />
                        )),
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    className="play-danger"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Reset the session? Everyone leaves the pool and courts go empty.",
                        )
                      ) {
                        void run(() => session.reset());
                      }
                    }}
                  >
                    Reset session
                  </button>

                  <h2 className="play-section-title">Club PIN</h2>
                  <p className="play-lede">
                    Off by default. When it is on, Settings and Reset need the PIN.
                    If it is forgotten, clear the PIN columns in Neon.
                  </p>
                  {pinEnabled ? (
                    <>
                      <label className="scoreboard-label" htmlFor="current-pin">
                        Current PIN
                      </label>
                      <input
                        id="current-pin"
                        inputMode="numeric"
                        autoComplete="off"
                        value={currentPin}
                        onChange={(event) => setCurrentPin(event.target.value)}
                      />
                      <label className="scoreboard-label" htmlFor="new-pin">
                        New PIN
                      </label>
                      <input
                        id="new-pin"
                        inputMode="numeric"
                        autoComplete="off"
                        value={newPin}
                        onChange={(event) => setNewPin(event.target.value)}
                      />
                      <div className="play-button-row">
                        <button
                          type="button"
                          className="play-secondary"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await session.updatePin({
                                action: "change",
                                currentPin,
                                pin: newPin,
                              });
                              setCurrentPin("");
                              setNewPin("");
                            })
                          }
                        >
                          Change PIN
                        </button>
                        <button
                          type="button"
                          className="play-danger"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await session.updatePin({
                                action: "disable",
                                currentPin,
                              });
                              setCurrentPin("");
                            })
                          }
                        >
                          Turn PIN off
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="scoreboard-label" htmlFor="enable-pin">
                        New PIN
                      </label>
                      <input
                        id="enable-pin"
                        inputMode="numeric"
                        autoComplete="off"
                        value={newPin}
                        onChange={(event) => setNewPin(event.target.value)}
                      />
                      <label className="scoreboard-label" htmlFor="confirm-pin">
                        Confirm PIN
                      </label>
                      <input
                        id="confirm-pin"
                        inputMode="numeric"
                        autoComplete="off"
                        value={confirmPin}
                        onChange={(event) => setConfirmPin(event.target.value)}
                      />
                      <button
                        type="button"
                        className="play-secondary"
                        disabled={busy}
                        onClick={() => {
                          if (newPin !== confirmPin) {
                            session.setNotice("Those PINs do not match.");
                            return;
                          }
                          void run(async () => {
                            await session.updatePin({
                              action: "enable",
                              pin: newPin,
                            });
                            setNewPin("");
                            setConfirmPin("");
                          });
                        }}
                      >
                        Turn PIN on
                      </button>
                    </>
                  )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </section>
      </main>
      {view ? <SessionTicker view={view} /> : null}
    </div>
  );
}

function PlayerEditor({
  id,
  name,
  detail,
  busy,
  canRemove = true,
  onRename,
  onRemove,
}: {
  id: string;
  name: string;
  detail: string;
  busy: boolean;
  canRemove?: boolean;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(name);

  return (
    <div className="play-edit-row">
      <label className="scoreboard-label" htmlFor={`player-${id}`}>
        {name} · {detail}
      </label>
      <div className="play-edit-controls">
        <input
          id={`player-${id}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="play-button-row">
          <button
            type="button"
            className="play-secondary"
            disabled={busy}
            onClick={() => onRename(draft)}
          >
            Save name
          </button>
          {canRemove ? (
            <button
              type="button"
              className="play-secondary"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Remove ${name} from the pool?`)) {
                  onRemove();
                }
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
