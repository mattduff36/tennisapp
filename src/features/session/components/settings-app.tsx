"use client";

import { useState } from "react";
import { TextSizeControl } from "@/features/pegboard/components/text-size-control";
import { useTextSize } from "@/features/pegboard/hooks/use-text-size";
import { MAX_COURT_COUNT, MIN_COURT_COUNT } from "../model/session";
import { useSession } from "../hooks/use-session";
import { PlayNav } from "./play-nav";
import { SessionTicker } from "./session-ticker";

export function SettingsApp() {
  const session = useSession(null);
  const { textSize, setTextSize } = useTextSize();
  const [busy, setBusy] = useState(false);
  const [courtNames, setCourtNames] = useState<Record<string, string>>({});

  const view = session.view;

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
          <p className="scoreboard-label">Everyone can edit</p>
          <h1 className="play-title">Settings</h1>
          {session.notice ? <p className="play-notice">{session.notice}</p> : null}
          {!view || session.loading ? (
            <p className="play-lede">Loading…</p>
          ) : (
            <>
              <h2 className="play-section-title">Display</h2>
              <p className="play-lede">
                Text size is saved on this device only.
              </p>
              <TextSizeControl textSize={textSize} onChange={setTextSize} />

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
            </>
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
