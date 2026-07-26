import { useMemo } from "react";
import type { AppData, WeeklyReflection } from "../types";
import { weeklyStats } from "../lib/analytics";
import Icon from "./Icon";

interface WeeklyReviewPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
}

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function WeeklyReviewPage({
  data,
  onDataChange
}: WeeklyReviewPageProps) {
  const stats = useMemo(() => weeklyStats(data), [data]);
  const reflection = data.weeklyReflections.find(
    (item) => item.weekStart === stats.weekStart
  ) ?? {
    weekStart: stats.weekStart,
    wins: "",
    lessons: "",
    nextWeek: "",
    updatedAt: new Date().toISOString()
  };

  function updateReflection(patch: Partial<WeeklyReflection>) {
    const next = {
      ...reflection,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    const exists = data.weeklyReflections.some(
      (item) => item.weekStart === stats.weekStart
    );
    onDataChange({
      ...data,
      weeklyReflections: exists
        ? data.weeklyReflections.map((item) =>
            item.weekStart === stats.weekStart ? next : item
          )
        : [next, ...data.weeklyReflections]
    });
  }

  const suggestion =
    stats.planned === 0
      ? "Takvimine birkaç gerçekçi iş ekleyerek haftayı görünür kıl."
      : stats.completionRate >= 80
        ? "Tempon güçlü. Gelecek hafta aynı yükü koruyup tek bir büyük hedefe ağırlık ver."
        : stats.completionRate >= 50
          ? "İyi ilerliyorsun. Yarım kalanlardan gerçekten önemli olanları gelecek haftaya taşı."
          : "Plan yükünü azalt. Önümüzdeki hafta her gün için en fazla üç önemli iş seç.";

  return (
    <div className="page-scroll review-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">HAFTANA YUKARIDAN BAK</span>
          <h1>Haftalık değerlendirme</h1>
          <p>
            {new Intl.DateTimeFormat("tr-TR", {
              day: "numeric",
              month: "long"
            }).format(new Date(`${stats.weekStart}T12:00:00`))}
            {" – "}
            {new Intl.DateTimeFormat("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric"
            }).format(new Date(`${stats.weekEnd}T12:00:00`))}
          </p>
        </div>
        <div className="review-score">
          <strong>%{stats.completionRate}</strong>
          <span>tamamlama</span>
        </div>
      </div>

      <div className="review-stats">
        <article>
          <Icon name="check" size={20} />
          <strong>{stats.completed}/{stats.planned}</strong>
          <span>Tamamlanan plan</span>
        </article>
        <article>
          <Icon name="book" size={20} />
          <strong>{stats.notesEdited}</strong>
          <span>Düzenlenen not</span>
        </article>
        <article>
          <Icon name="clock" size={20} />
          <strong>{stats.focusMinutes} dk</strong>
          <span>Odak süresi</span>
        </article>
        <article>
          <Icon name="target" size={20} />
          <strong>{stats.activeGoals}</strong>
          <span>Aktif hedef</span>
        </article>
      </div>

      <div className="review-grid">
        <section className="week-chart-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">GÜNLÜK TEMPO</span>
              <h2>Haftanın akışı</h2>
            </div>
          </div>
          <div className="week-bars">
            {stats.days.map((day, index) => (
              <div key={day.key}>
                <span>{day.completed}/{day.total}</span>
                <div>
                  <i style={{ height: `${Math.max(5, day.percentage)}%` }} />
                </div>
                <strong>{DAY_LABELS[index]}</strong>
              </div>
            ))}
          </div>
          <div className="review-suggestion">
            <Icon name="sun" size={20} />
            <div>
              <strong>Notebook-PC önerisi</strong>
              <p>{suggestion}</p>
            </div>
          </div>
        </section>

        <section className="reflection-card">
          <span className="eyebrow">KENDİNE NOT</span>
          <h2>Haftayı kapat</h2>
          <label>
            Bu haftanın kazanımları
            <textarea
              value={reflection.wins}
              onChange={(event) =>
                updateReflection({ wins: event.target.value })
              }
              placeholder="Neyi başardın, ne iyi gitti?"
            />
          </label>
          <label>
            Öğrendiğim şey
            <textarea
              value={reflection.lessons}
              onChange={(event) =>
                updateReflection({ lessons: event.target.value })
              }
              placeholder="Neyi farklı yapardın?"
            />
          </label>
          <label>
            Gelecek haftanın odağı
            <textarea
              value={reflection.nextWeek}
              onChange={(event) =>
                updateReflection({ nextWeek: event.target.value })
              }
              placeholder="Tek bir ana yön seç."
            />
          </label>
          <small>Yazdıkların otomatik kaydedilir.</small>
        </section>
      </div>
    </div>
  );
}
