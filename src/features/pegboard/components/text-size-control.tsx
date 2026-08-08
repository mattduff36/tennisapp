"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TextSizeIcon } from "../graphics/text-size-icon";
import {
  TEXT_SIZE_LABELS,
  TEXT_SIZES,
  textSizeFromIndex,
  textSizeIndex,
  type TextSize,
} from "../text-size/text-size";

export function TextSizeControl({
  textSize,
  onChange,
}: {
  textSize: TextSize;
  onChange: (size: TextSize) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const sliderId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    function handleClose() {
      setOpen(false);
      triggerRef.current?.focus();
    }

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [open]);

  const index = textSizeIndex(textSize);
  const label = TEXT_SIZE_LABELS[textSize];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button text-size-trigger"
        aria-label="Text size"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <TextSizeIcon className="text-size-trigger-icon" />
      </button>

      <dialog
        ref={dialogRef}
        className="text-size-dialog"
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setOpen(false);
          }
        }}
      >
        <div className="text-size-dialog-panel">
          <p className="scoreboard-label">Display</p>
          <h2 id={titleId}>Text size</h2>
          <p className="text-size-preview" aria-live="polite">
            Preview: players waiting and on court stay easy to read.
          </p>

          <p className="text-size-current" aria-live="polite">
            {label}
          </p>

          <div className="text-size-slider-shell">
            <span className="text-size-end text-size-end-small" aria-hidden="true">
              A
            </span>
            <input
              id={sliderId}
              className="text-size-slider"
              type="range"
              min={0}
              max={TEXT_SIZES.length - 1}
              step={1}
              value={index}
              aria-label="Choose text size"
              aria-valuetext={label}
              onChange={(event) => {
                onChange(textSizeFromIndex(Number(event.target.value)));
              }}
            />
            <span className="text-size-end text-size-end-large" aria-hidden="true">
              A
            </span>
          </div>

          <ol className="text-size-steps" aria-hidden="true">
            {TEXT_SIZES.map((size) => (
              <li
                key={size}
                className={
                  size === textSize
                    ? "text-size-step is-active"
                    : "text-size-step"
                }
              >
                {TEXT_SIZE_LABELS[size]}
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="primary-button text-size-done"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      </dialog>
    </>
  );
}
