import { useEffect, useMemo, useState } from "react";
import type { AppData, Reminder, RepeatMode } from "../types";
import { uid } from "../lib/data";
import Icon from "./Icon";

interface RemindersPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  focusReminderId: string | null;
  onFocusHandled: () => void;
  onToast: (message: string) => void;
}

function defaultDueAt() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDay(date: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (dayKey(date) === dayKey(today)) return "Bugün";
  if (dayKey(date) === dayKey(tomorrow)) return "Yarın";
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

export default function RemindersPage({
  data,
  onDataChange,
  focusReminderId,
  onFocusHandled,
  onToast
}: RemindersPageProps) {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueAt, setDueAt] = useState(defaultDueAt);
  const [repeat, setRepeat] = useState<RepeatMode>("none");

  useEffect(() => {
    if (!focusReminderId) return;
    const timer = window.setTimeout(onFocusHandled, 2500);
    return () => window.clearTimeout(timer);
  }, [focusReminderId, onFocusHandled]);

  const grouped = useMemo(() => {
    const result = new Map<string, Reminder[]>();
    [...data.reminders]
      .sort(
        (a, b) =>
          Number(a.completed) - Number(b.completed) ||
          new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      )
      .forEach((reminder) => {
        const key = dayKey(new Date(reminder.dueAt));
        const items = result.get(key) ?? [];
        items.push(reminder);
        result.set(key, items);
      });
    return [...result.entries()];
  }, [data.reminders]);

  function addReminder(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !dueAt) return;
    const reminder: Reminder = {
      id: uid(),
      title: title.trim(),
      courseId: courseId || null,
      dueAt: new Date(dueAt).toISOString(),
      repeat,
      completed: false,
      createdAt: new Date().toISOString()
    };
    onDataChange({ ...data, reminders: [...data.reminders, reminder] });
    setTitle("");
    setDueAt(defaultDueAt());
    setRepeat("none");
    onToast("Alarm planlandı.");
  }

  function toggle(reminder: Reminder) {
    onDataChange({
      ...data,
      reminders: data.reminders.map((item) =>
        item.id === reminder.id
          ? { ...item, completed: !item.completed }
          : item
      )
    });
  }

  function remove(id: string) {
    onDataChange({
      ...data,
      reminders: data.reminders.filter((item) => item.id !== id)
    });
    onToast("Hatırlatıcı silindi.");
  }

  const upcoming = data.reminders.filter(
    (item) => !item.completed && new Date(item.dueAt).getTime() >= Date.now()
  ).length;
  const completed = data.reminders.filter((item) => item.completed).length;

  return (
    <div className="page-scroll">
      <div className="page-heading">
        <div>
          <span className="eyebrow">GÜN GÜN PLANLA</span>
          <h1>Planlayıcı ve alarmlar</h1>
          <p>Ders, sınav ve çalışma hedeflerini masaüstü bildirimiyle hatırla.</p>
        </div>
        <div className="page-stats">
          <div>
            <strong>{upcoming}</strong>
            <span>Yaklaşan</span>
          </div>
          <div>
            <strong>{completed}</strong>
            <span>Tamamlanan</span>
          </div>
        </div>
      </div>

      <div className="planner-grid">
        <aside className="new-reminder-card">
          <div className="card-icon amber">
            <Icon name="bell" size={22} />
          </div>
          <h2>Yeni alarm</h2>
          <p>Uygulama sistem tepsisinde açıkken zamanı gelince bildirim gönderir.</p>
          <form onSubmit={addReminder}>
            <label>
              Başlık
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Örn. Data Structures tekrar"
                autoFocus
              />
            </label>
            <label>
              Ders
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              >
                <option value="">Ders seçilmedi</option>
                {data.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} · {course.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Gün ve saat
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </label>
            <label>
              Tekrar
              <select
                value={repeat}
                onChange={(event) => setRepeat(event.target.value as RepeatMode)}
              >
                <option value="none">Bir kez</option>
                <option value="daily">Her gün</option>
                <option value="weekly">Her hafta</option>
              </select>
            </label>
            <button className="primary-button wide" type="submit">
              <Icon name="plus" size={17} />
              Alarm oluştur
            </button>
          </form>
        </aside>

        <section className="agenda">
          <div className="agenda-head">
            <div>
              <span className="eyebrow">AJANDA</span>
              <h2>Çalışma takvimin</h2>
            </div>
            <span className="notification-ready">
              <span />
              Bildirimler hazır
            </span>
          </div>
          {grouped.length === 0 ? (
            <div className="empty-state">
              <Icon name="calendar" size={34} />
              <strong>Takvimin boş</strong>
              <span>Soldaki formdan ilk alarmını oluştur.</span>
            </div>
          ) : (
            grouped.map(([key, reminders]) => {
              const date = new Date(reminders[0].dueAt);
              return (
                <div className="agenda-day" key={key}>
                  <div className="agenda-date">
                    <strong>{formatDay(date)}</strong>
                    <span>
                      {new Intl.DateTimeFormat("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }).format(date)}
                    </span>
                  </div>
                  <div className="agenda-items">
                    {reminders.map((reminder) => {
                      const course = data.courses.find(
                        (item) => item.id === reminder.courseId
                      );
                      const highlighted = focusReminderId === reminder.id;
                      return (
                        <article
                          className={`agenda-item ${reminder.completed ? "done" : ""} ${highlighted ? "highlight" : ""}`}
                          key={reminder.id}
                        >
                          <button
                            className="check-button"
                            onClick={() => toggle(reminder)}
                            aria-label="Tamamlandı olarak işaretle"
                          >
                            {reminder.completed && <Icon name="check" size={15} />}
                          </button>
                          <div
                            className="agenda-accent"
                            style={{
                              backgroundColor: course?.color || "#d39b36"
                            }}
                          />
                          <div className="agenda-copy">
                            <strong>{reminder.title}</strong>
                            <div>
                              <span>
                                <Icon name="clock" size={14} />
                                {new Intl.DateTimeFormat("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }).format(new Date(reminder.dueAt))}
                              </span>
                              {course && (
                                <span>
                                  {course.code} · {course.name}
                                </span>
                              )}
                              {reminder.repeat !== "none" && (
                                <span className="repeat-badge">
                                  {reminder.repeat === "daily"
                                    ? "Her gün"
                                    : "Her hafta"}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className="plain-icon"
                            onClick={() => remove(reminder.id)}
                            aria-label="Alarmı sil"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
