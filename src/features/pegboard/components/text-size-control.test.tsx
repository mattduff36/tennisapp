import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { TextSize } from "../text-size/text-size";
import { TextSizeControl } from "./text-size-control";

function Harness({ initial = "normal" as TextSize }) {
  const [textSize, setTextSize] = useState<TextSize>(initial);
  return (
    <div>
      <p data-testid="current-size">{textSize}</p>
      <TextSizeControl textSize={textSize} onChange={setTextSize} />
    </div>
  );
}

describe("TextSizeControl", () => {
  it("TEXT-03: opens modal and updates size from slider", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Text size" }));
    expect(screen.getByRole("heading", { name: "Text size" })).toBeVisible();
    expect(document.querySelector(".text-size-current")).toHaveTextContent(
      "Normal",
    );

    const slider = screen.getByLabelText("Choose text size");
    fireEvent.change(slider, { target: { value: "4" } });

    expect(screen.getByTestId("current-size")).toHaveTextContent("largest");
    expect(document.querySelector(".text-size-current")).toHaveTextContent(
      "Largest",
    );

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("button", { name: "Text size" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
