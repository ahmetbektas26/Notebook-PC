import { useEffect, useMemo, useState } from "react";
import type {
  AppData,
  PlannerItem,
  PlannerKind,
  RepeatMode
} from "../types";
import { uid } from "../lib/data";
import {
  fromDateKey,
  monthCells,
  PLANNER_KIND_LABELS,
  todayKey,
  toDateKey,
  WEEKDAYS
} from "../lib/calendar";
import Icon from "./Icon";

interface CalendarPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  focusItemId: string | null;
  onToast: (message: string) => void;
}

export default function CalendarPage({
  data,
  onDataChange,
  focusItemId,
  onToast
}: CalendarPageProps) {
  const now = new Date();
  const [cursor, setCursor] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1, 12)
  );
  const [selected, setSelected] = useState(todayKey);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [time, setTime] = useState("");
  const [kind, setKind] = useState<PlannerKind>("task");
  const [reminder, setReminder] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const selectedItems = data.plannerItems
    .filter((item) => item.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time));

  useEffect(() => {
    if (!focusItemId) return;
    const item = data.plannerItems.find((entry) => entry.id === focusItemId);
    if (!item) return;
    const date = fromDateKey(item.date);
    setSelected(item.date);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1, 12));
  }, [data.plannerItems, focusItemId]);

  function moveMonth(direction: number) {
    setCursor(
      new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1, 12)
    );
  }

  function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const item: PlannerItem = {
      id: uid(),
      title: title.trim(),
      details: details.trim(),
      date: selected,
      time,
      kind,
      reminder: reminder && Boolean(time),
      repeat: reminder && time ? repeat : "none",
      completed: false,
      createdAt: new Date().toISOString()
    };
    onDataChange({ ...data, plannerItems: [...data.plannerItems, item] });
    setTitle("");
    setDetails("");
    setTime("");
    setReminder(false);
    setRepeat("none");
    onToast("Takvime eklendi.");
  }

  function updateItem(id: string, patch: Partial<PlannerItem>) {
    onDataChange({
      ...data,
      plannerItems: data.plannerItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    });
  }

  function removeItem(id: string) {
    onDataChange({
      ...data,
      plannerItems: data.plannerItems.filter((item) => item.id !== id)
    });
    onToast("Takvim kaydı silindi.");
  }

  return (
    <div className="page-scroll calendar-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">HAYATININ TAKVİMİ</span>
          <h1>Planla, not al, ilerle</h1>
          <p>Bir güne tıkla; o güne görev, plan, kısa not veya hedef bırak.</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => {
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1, 12));
            setSelected(todayKey());
          }}
        >
          Bugüne dön
        </button>
      </div>

      <div className="calendar-layout">
        <section className="month-card">
          <div className="month-head">
            <button onClick={() => moveMonth(-1)} aria-label="Önceki ay">
              ‹
            </button>
            <h2>
              {new Intl.DateTimeFormat("tr-TR", {
                month: "long",
                year: "numeric"
              }).format(cursor)}
            </h2>
            <button onClick={() => moveMonth(1)} aria-label="Sonraki ay">
              ›
            </button>
          </div>
          <div className="weekday-row">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="month-grid">
            {cells.map((date) => {
              const key = toDateKey(date);
              const items = data.plannerItems.filter((item) => item.date === key);
              const outside = date.getMonth() !== cursor.getMonth();
              return (
                <button
                  key={key}
                  className={[
                    outside ? "outside" : "",
                    key === selected ? "selected" : "",
                    key === todayKey() ? "today" : ""
                  ].join(" ")}
                  onClick={() => setSelected(key)}
                >
                  <span>{date.getDate()}</span>
                  <div className="calendar-dots">
                    {items.slice(0, 4).map((item) => (
                      <i className={item.kind} key={item.id} />
                    ))}
                  </div>
                  {items.length > 4 && <small>+{items.length - 4}</small>}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="day-panel">
          <div className="day-panel-head">
            <span className="eyebrow">SEÇİLİ GÜN</span>
            <h2>
              {new Intl.DateTimeFormat("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long"
              }).format(fromDateKey(selected))}
            </h2>
            <span>{selectedItems.length} kayıt</span>
          </div>

          <div className="day-items">
            {selectedItems.length === 0 ? (
              <div className="soft-empty">
                <Icon name="calendar" size={26} />
                <strong>Bu gün boş</strong>
                <span>Aşağıdan bir şey ekleyebilirsin.</span>
              </div>
            ) : (
              selectedItems.map((item) => (
                <article
                  key={item.id}
                  className={`${item.completed ? "done" : ""} ${focusItemId === item.id ? "highlight" : ""}`}
                >
                  <button
                    className="check-button"
                    onClick={() =>
                      updateItem(item.id, { completed: !item.completed })
                    }
                  >
                    {item.completed && <Icon name="check" size={14} />}
                  </button>
                  <div className={`calendar-kind ${item.kind}`}>
                    {PLANNER_KIND_LABELS[item.kind]}
                  </div>
                  <div className="day-item-copy">
                    <strong>{item.title}</strong>
                    {item.details && <p>{item.details}</p>}
                    <span>
                      {item.time || "Saat yok"}
                      {item.reminder && " · Alarm açık"}
                    </span>
                  </div>
                  <button
                    className="plain-icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </article>
              ))
            )}
          </div>

          <form className="day-form" onSubmit={addItem}>
            <span className="eyebrow">BU GÜNE EKLE</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ne yapmak veya hatırlamak istiyorsun?"
            />
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Detay veya kısa not (isteğe bağlı)"
            />
            <div className="day-form-row">
              <select
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as PlannerKind)
                }
              >
                {Object.entries(PLANNER_KIND_LABELS).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
            <label className={`reminder-toggle ${reminder ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={reminder}
                onChange={(event) => setReminder(event.target.checked)}
                disabled={!time}
              />
              <Icon name="bell" size={15} />
              Saatinde masaüstü alarmı ver
            </label>
            {reminder && time && (
              <select
                value={repeat}
                onChange={(event) =>
                  setRepeat(event.target.value as RepeatMode)
                }
              >
                <option value="none">Bir kez</option>
                <option value="daily">Her gün</option>
                <option value="weekly">Her hafta</option>
              </select>
            )}
            <button className="primary-button wide" type="submit">
              <Icon name="plus" size={16} />
              Seçili güne ekle
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
