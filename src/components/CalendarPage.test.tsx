// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialData } from "../lib/data";
import CalendarPage from "./CalendarPage";

afterEach(cleanup);

describe("takvim ve alarm formu", () => {
  it("saatli, haftalık tekrarlanan masaüstü alarmı oluşturur", async () => {
    const data = createInitialData();
    const onDataChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <CalendarPage
        data={data}
        onDataChange={onDataChange}
        focusItemId={null}
        onToast={vi.fn()}
      />
    );

    await user.type(
      screen.getByPlaceholderText(
        "Ne yapmak veya hatırlamak istiyorsun?"
      ),
      "Haftalık kontrol"
    );
    const timeInput = container.querySelector('input[type="time"]');
    if (!(timeInput instanceof HTMLInputElement))
      throw new Error("saat alanı yok");
    fireEvent.change(timeInput, { target: { value: "09:30" } });
    await user.click(
      screen.getByLabelText("Saatinde masaüstü alarmı ver")
    );
    await user.selectOptions(screen.getByDisplayValue("Bir kez"), "weekly");
    await user.click(
      screen.getByRole("button", { name: "Seçili güne ekle" })
    );

    expect(onDataChange).toHaveBeenCalledOnce();
    expect(onDataChange.mock.calls[0][0].plannerItems[0]).toEqual(
      expect.objectContaining({
        title: "Haftalık kontrol",
        time: "09:30",
        reminder: true,
        repeat: "weekly",
        completed: false
      })
    );
  });

  it("saat seçilmeden alarmı etkinleştirmez", () => {
    render(
      <CalendarPage
        data={createInitialData()}
        onDataChange={vi.fn()}
        focusItemId={null}
        onToast={vi.fn()}
      />
    );
    expect(
      (screen.getByLabelText(
        "Saatinde masaüstü alarmı ver"
      ) as HTMLInputElement).disabled
    ).toBe(true);
  });
});
