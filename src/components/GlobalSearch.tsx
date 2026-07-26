import { useEffect, useMemo, useRef, useState } from "react";
import type { AppData } from "../types";
import type { SearchHit } from "../lib/search";
import { searchAppData } from "../lib/search";
import Icon from "./Icon";

interface GlobalSearchProps {
  data: AppData;
  onSelect: (hit: SearchHit) => void;
}

const LABELS: Record<SearchHit["kind"], string> = {
  note: "Not",
  pdf: "PDF",
  planner: "Takvim",
  goal: "Hedef",
  course: "Ders",
  grade: "Not ortalaması"
};

export default function GlobalSearch({ data, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchAppData(data, query), [data, query]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    const pointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("mousedown", pointer);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("mousedown", pointer);
    };
  }, []);

  function choose(hit: SearchHit) {
    onSelect(hit);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="global-search" ref={rootRef}>
      <Icon name="search" size={18} />
      <input
        ref={inputRef}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && hits[0]) choose(hits[0]);
        }}
        placeholder="Not, PDF, hedef, takvim veya ders ara…"
      />
      {query ? (
        <button
          onClick={() => setQuery("")}
          aria-label="Aramayı temizle"
        >
          ×
        </button>
      ) : (
        <kbd>Ctrl K</kbd>
      )}

      {open && query.trim().length >= 2 && (
        <div className="search-results">
          <div className="search-results-head">
            <span>TÜM UYGULAMADA</span>
            <small>{hits.length} sonuç</small>
          </div>
          {hits.length === 0 ? (
            <div className="search-empty">
              <Icon name="search" size={24} />
              <span>Bu ifadeyle eşleşen bir şey bulunamadı.</span>
            </div>
          ) : (
            hits.map((hit) => (
              <button key={`${hit.kind}-${hit.id}`} onClick={() => choose(hit)}>
                <span className={`search-result-icon ${hit.kind}`}>
                  <Icon
                    name={
                      hit.kind === "planner"
                        ? "calendar"
                        : hit.kind === "goal"
                          ? "target"
                          : hit.kind === "course" || hit.kind === "grade"
                            ? "school"
                            : hit.kind === "pdf"
                              ? "file"
                              : "book"
                    }
                    size={17}
                  />
                </span>
                <span className="search-result-copy">
                  <strong>{hit.title}</strong>
                  <small>{hit.subtitle}</small>
                </span>
                <span className="search-kind">{LABELS[hit.kind]}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
