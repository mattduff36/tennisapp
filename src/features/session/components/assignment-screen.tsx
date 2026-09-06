"use client";

import type { SessionMeView } from "../model/session-view";

export function AssignmentScreen({
  me,
  notice,
  busy,
  onDone,
}: {
  me: SessionMeView;
  notice: string | null;
  busy: boolean;
  onDone: () => void;
}) {
  return (
    <section className="play-card play-assignment">
      <p className="scoreboard-label">You are on</p>
      <h1 className="play-title">{me.courtName ?? "A court"}</h1>
      {notice ? <p className="play-notice">{notice}</p> : null}
      <p className="play-lede">Playing with</p>
      <ul className="play-pool">
        <li>{me.name} (you)</li>
        {me.partners.map((partner) => (
          <li key={partner.id}>{partner.name}</li>
        ))}
      </ul>
      <button type="button" className="play-primary" disabled={busy} onClick={onDone}>
        I&apos;m done
      </button>
    </section>
  );
}
