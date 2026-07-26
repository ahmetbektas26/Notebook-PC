import { useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask
} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PdfAnnotation, PdfAttachment } from "../types";
import { uid } from "../lib/data";
import Icon from "./Icon";

GlobalWorkerOptions.workerSrc = workerSrc;

interface PdfReaderProps {
  attachment: PdfAttachment;
  onChange: (attachment: PdfAttachment) => void;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

export default function PdfReader({
  attachment,
  onChange,
  onClose
}: PdfReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<RenderTask | null>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"browse" | "underline">("browse");
  const [start, setStart] = useState<Point | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    let alive = true;
    let task: ReturnType<typeof getDocument> | null = null;
    (async () => {
      try {
        setLoading(true);
        const dataUrl = await window.notebookAPI?.readAttachment(
          attachment.fileName
        );
        if (!dataUrl) throw new Error("PDF verisi okunamadı.");
        const bytes = new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
        task = getDocument({ data: bytes });
        const loaded = await task.promise;
        if (alive) setDocument(loaded);
      } catch (caught) {
        if (alive)
          setError(
            caught instanceof Error ? caught.message : "PDF açılamadı."
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      task?.destroy();
    };
  }, [attachment.fileName]);

  useEffect(() => {
    if (!document || !canvasRef.current) return;
    let alive = true;
    (async () => {
      const pdfPage = await document.getPage(page);
      if (!alive || !canvasRef.current) return;
      const viewport = pdfPage.getViewport({ scale: 1.35 * zoom });
      const canvas = canvasRef.current;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      renderRef.current?.cancel();
      renderRef.current = pdfPage.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0]
      });
      try {
        await renderRef.current.promise;
      } catch {
        // A newer render intentionally cancels the previous one.
      }
    })();
    return () => {
      alive = false;
      renderRef.current?.cancel();
    };
  }, [document, page, zoom]);

  function relativePoint(event: React.PointerEvent<HTMLDivElement>) {
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    };
  }

  function finishUnderline(event: React.PointerEvent<HTMLDivElement>) {
    if (mode !== "underline" || !start) return;
    const end = relativePoint(event);
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    if (width < 0.015) {
      setStart(null);
      return;
    }
    const annotation: PdfAnnotation = {
      id: uid(),
      type: "underline",
      page,
      x: left,
      y: top,
      width,
      height: 0.018,
      text: "",
      color: "#e3a72f",
      createdAt: new Date().toISOString()
    };
    onChange({
      ...attachment,
      annotations: [...attachment.annotations, annotation]
    });
    setStart(null);
  }

  function addPageNote(event: React.FormEvent) {
    event.preventDefault();
    if (!noteText.trim()) return;
    const annotation: PdfAnnotation = {
      id: uid(),
      type: "note",
      page,
      x: 0.03,
      y: 0.03,
      width: 0,
      height: 0,
      text: noteText.trim(),
      color: "#5576b9",
      createdAt: new Date().toISOString()
    };
    onChange({
      ...attachment,
      annotations: [...attachment.annotations, annotation]
    });
    setNoteText("");
  }

  function removeAnnotation(id: string) {
    onChange({
      ...attachment,
      annotations: attachment.annotations.filter((item) => item.id !== id)
    });
  }

  const pageAnnotations = attachment.annotations.filter(
    (annotation) => annotation.page === page
  );

  return (
    <div className="pdf-reader-backdrop" role="dialog" aria-modal="true">
      <section className="pdf-reader">
        <header>
          <div>
            <span className="pdf-file-icon">PDF</span>
            <div>
              <strong>{attachment.originalName}</strong>
              <small>{attachment.annotations.length} işaret</small>
            </div>
          </div>
          <div className="pdf-reader-tools">
            <button
              className={mode === "underline" ? "active" : ""}
              onClick={() =>
                setMode(mode === "underline" ? "browse" : "underline")
              }
              title="Sayfada sürükleyerek altını çiz"
            >
              <span className="underline-tool">U</span>
              Altını çiz
            </button>
            <button
              onClick={() => setZoom(Math.max(0.6, zoom - 0.15))}
              aria-label="Uzaklaştır"
            >
              −
            </button>
            <span>%{Math.round(zoom * 100)}</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.15))}
              aria-label="Yakınlaştır"
            >
              +
            </button>
            <button
              onClick={() =>
                window.notebookAPI?.openAttachment(attachment.fileName)
              }
              title="Windows okuyucusunda aç"
            >
              <Icon name="external" size={17} />
            </button>
            <button onClick={onClose} aria-label="Kapat">
              ×
            </button>
          </div>
        </header>

        <div className="pdf-reader-body">
          <main className={`pdf-stage ${mode}`}>
            {loading && <div className="pdf-loading">PDF hazırlanıyor…</div>}
            {error && <div className="pdf-loading error">{error}</div>}
            <div
              className="pdf-canvas-wrap"
              ref={pageRef}
              onPointerDown={(event) => {
                if (mode !== "underline") return;
                event.currentTarget.setPointerCapture(event.pointerId);
                setStart(relativePoint(event));
              }}
              onPointerUp={finishUnderline}
            >
              <canvas ref={canvasRef} />
              <div className="pdf-annotation-layer">
                {pageAnnotations
                  .filter((annotation) => annotation.type === "underline")
                  .map((annotation) => (
                    <button
                      key={annotation.id}
                      className="pdf-underline"
                      style={{
                        left: `${annotation.x * 100}%`,
                        top: `${annotation.y * 100}%`,
                        width: `${annotation.width * 100}%`,
                        height: `${annotation.height * 100}%`,
                        borderColor: annotation.color
                      }}
                      onDoubleClick={() => removeAnnotation(annotation.id)}
                      title="Silmek için çift tıkla"
                    />
                  ))}
              </div>
            </div>
          </main>

          <aside className="pdf-notes-panel">
            <span className="eyebrow">SAYFA {page} NOTLARI</span>
            <form onSubmit={addPageNote}>
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Bu sayfayla ilgili bir not bırak…"
              />
              <button className="primary-button" type="submit">
                <Icon name="plus" size={15} />
                Sayfaya bağla
              </button>
            </form>
            <div className="pdf-page-notes">
              {pageAnnotations.filter((item) => item.type === "note").length ===
              0 ? (
                <p>Bu sayfada henüz açıklama yok.</p>
              ) : (
                pageAnnotations
                  .filter((item) => item.type === "note")
                  .map((annotation) => (
                    <article key={annotation.id}>
                      <p>{annotation.text}</p>
                      <button
                        className="plain-icon"
                        onClick={() => removeAnnotation(annotation.id)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </article>
                  ))
              )}
            </div>
            <div className="all-pdf-notes">
              <span className="eyebrow">TÜM İŞARETLER</span>
              {attachment.annotations
                .filter((item) => item.type === "note")
                .map((annotation) => (
                  <button
                    key={annotation.id}
                    onClick={() => setPage(annotation.page)}
                  >
                    <strong>Sayfa {annotation.page}</strong>
                    <span>{annotation.text}</span>
                  </button>
                ))}
            </div>
          </aside>
        </div>

        <footer>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            ‹ Önceki
          </button>
          <span>
            Sayfa <strong>{page}</strong> / {document?.numPages ?? "—"}
          </span>
          <button
            onClick={() =>
              setPage(Math.min(document?.numPages ?? page, page + 1))
            }
            disabled={!document || page >= document.numPages}
          >
            Sonraki ›
          </button>
        </footer>
      </section>
    </div>
  );
}
