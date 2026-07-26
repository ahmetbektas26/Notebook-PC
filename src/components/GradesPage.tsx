import { useMemo, useState } from "react";
import type { AppData, GradeLetter } from "../types";
import { uid } from "../lib/data";
import {
  calculateProjectedGpa,
  calculateTermGpa,
  GRADE_POINTS,
  GRADE_RANGES
} from "../lib/grade";
import Icon from "./Icon";

interface GradesPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
}

export default function GradesPage({
  data,
  onDataChange
}: GradesPageProps) {
  const [targetGpa, setTargetGpa] = useState(2.6);
  const [graduationCredits, setGraduationCredits] = useState(230);
  const term = useMemo(() => calculateTermGpa(data.grades), [data.grades]);
  const projected = calculateProjectedGpa(
    data.settings.currentCredits,
    data.settings.currentGpa,
    data.grades
  );

  const remainingCredits = Math.max(
    0,
    graduationCredits - data.settings.currentCredits
  );
  const requiredGpa = remainingCredits
    ? (targetGpa * graduationCredits -
        data.settings.currentGpa * data.settings.currentCredits) /
      remainingCredits
    : 0;

  function addCourse() {
    onDataChange({
      ...data,
      grades: [
        ...data.grades,
        { id: uid(), course: "", ects: 6, letter: "B+" }
      ]
    });
  }

  function updateGrade(
    id: string,
    field: "course" | "ects" | "letter",
    value: string | number
  ) {
    onDataChange({
      ...data,
      grades: data.grades.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    });
  }

  function updateSettings(
    field: "currentCredits" | "currentGpa",
    value: number
  ) {
    onDataChange({
      ...data,
      settings: { ...data.settings, [field]: value }
    });
  }

  return (
    <div className="page-scroll">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DOĞUŞ ÜNİVERSİTESİ</span>
          <h1>AKTS ağırlıklı not ortalaması</h1>
          <p>
            Derslerin AKTS ve harf notlarını gir; dönem ve tahmini genel ortalaman
            anında hesaplansın.
          </p>
        </div>
        <span className="dogus-badge">DOU · 4.00 sistemi</span>
      </div>

      <div className="grade-overview">
        <article className="gpa-card dark">
          <span>Bu dönem</span>
          <strong>{term.gpa.toFixed(2)}</strong>
          <div>
            <span>{term.totalEcts} AKTS</span>
            <span>{data.grades.length} ders</span>
          </div>
        </article>
        <article className="gpa-card accent">
          <span>Tahmini genel ortalama</span>
          <strong>{projected.toFixed(2)}</strong>
          <div>
            <span>
              {data.settings.currentCredits + term.totalEcts} toplam AKTS
            </span>
            <span>4.00 üzerinden</span>
          </div>
        </article>
        <article className="current-gpa-card">
          <span className="eyebrow">MEVCUT DURUM</span>
          <div>
            <label>
              Tamamlanan AKTS
              <input
                type="number"
                min="0"
                value={data.settings.currentCredits}
                onChange={(event) =>
                  updateSettings("currentCredits", Number(event.target.value))
                }
              />
            </label>
            <label>
              Güncel GANO
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={data.settings.currentGpa}
                onChange={(event) =>
                  updateSettings("currentGpa", Number(event.target.value))
                }
              />
            </label>
          </div>
        </article>
      </div>

      <div className="grades-grid">
        <section className="grade-table-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">DÖNEM DERSLERİ</span>
              <h2>Notlarını gir</h2>
            </div>
            <button className="secondary-button" onClick={addCourse}>
              <Icon name="plus" size={16} />
              Ders ekle
            </button>
          </div>

          <div className="grade-table">
            <div className="grade-row grade-header">
              <span>Ders</span>
              <span>AKTS</span>
              <span>Harf notu</span>
              <span>Katsayı</span>
              <span />
            </div>
            {data.grades.length === 0 ? (
              <div className="grade-empty">
                <span>Henüz ders eklenmedi.</span>
                <button onClick={addCourse}>İlk dersi ekle</button>
              </div>
            ) : (
              data.grades.map((entry) => (
                <div className="grade-row" key={entry.id}>
                  <input
                    value={entry.course}
                    onChange={(event) =>
                      updateGrade(entry.id, "course", event.target.value)
                    }
                    placeholder="Ders adı / kodu"
                  />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={entry.ects}
                    onChange={(event) =>
                      updateGrade(entry.id, "ects", Number(event.target.value))
                    }
                  />
                  <select
                    value={entry.letter}
                    onChange={(event) =>
                      updateGrade(
                        entry.id,
                        "letter",
                        event.target.value as GradeLetter
                      )
                    }
                  >
                    {Object.keys(GRADE_POINTS).map((letter) => (
                      <option value={letter} key={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                  <strong>{GRADE_POINTS[entry.letter].toFixed(2)}</strong>
                  <button
                    className="plain-icon"
                    onClick={() =>
                      onDataChange({
                        ...data,
                        grades: data.grades.filter(
                          (item) => item.id !== entry.id
                        )
                      })
                    }
                    aria-label="Dersi sil"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="goal-card">
          <div className="card-icon green">
            <Icon name="chart" size={22} />
          </div>
          <span className="eyebrow">MEZUNİYET HEDEFİ</span>
          <h2>Hedef GANO hesabı</h2>
          <label>
            Hedef GANO
            <input
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={targetGpa}
              onChange={(event) => setTargetGpa(Number(event.target.value))}
            />
          </label>
          <label>
            Mezuniyet AKTS
            <input
              type="number"
              min={data.settings.currentCredits}
              value={graduationCredits}
              onChange={(event) =>
                setGraduationCredits(Number(event.target.value))
              }
            />
          </label>
          <div
            className={`required-result ${requiredGpa > 4 ? "impossible" : ""}`}
          >
            <span>Kalan {remainingCredits} AKTS'de gereken ortalama</span>
            <strong>
              {requiredGpa > 4
                ? "4.00 üstü"
                : Math.max(0, requiredGpa).toFixed(2)}
            </strong>
            <small>
              {requiredGpa > 4
                ? "Bu hedef mevcut değerlerle matematiksel olarak mümkün değil."
                : "Bu değeri veya üstünü yakalarsan hedefe ulaşırsın."}
            </small>
          </div>
        </aside>
      </div>

      <section className="scale-card">
        <div>
          <span className="eyebrow">NOT DÖNÜŞÜMÜ</span>
          <h2>Doğuş Üniversitesi harf notu tablosu</h2>
        </div>
        <div className="scale-grid">
          {GRADE_RANGES.map((range) => (
            <div key={range.letter}>
              <strong>{range.letter}</strong>
              <span>
                {range.min}–{range.max}
              </span>
              <small>{GRADE_POINTS[range.letter].toFixed(2)}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
