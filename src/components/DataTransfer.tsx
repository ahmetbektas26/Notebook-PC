import type { AppData, PdfAttachment } from "../types";
import { migrateAppData } from "../lib/data";
import {
  dataToCsv,
  dataToMarkdown,
  dataToPrintableHtml,
  markdownFileToNote,
  mergeCsv,
  pdfFileToNote
} from "../lib/transfer";
import { uid } from "../lib/data";
import Icon from "./Icon";

interface DataTransferProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onToast: (message: string) => void;
}

const stamp = () => new Date().toISOString().slice(0, 10);

export default function DataTransfer({
  data,
  onDataChange,
  onToast
}: DataTransferProps) {
  async function exportJson() {
    if (window.notebookAPI) {
      const path = await window.notebookAPI.exportBackup(data);
      if (path) onToast("JSON yedeği oluşturuldu.");
      return;
    }
    download(
      JSON.stringify(data, null, 2),
      "application/json",
      `Notebook-PC-yedek-${stamp()}.json`
    );
  }

  function download(content: string, type: string, name: string) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function exportText(kind: "md" | "csv") {
    const content = kind === "md" ? dataToMarkdown(data) : dataToCsv(data);
    const name = `Notebook-PC-${stamp()}.${kind}`;
    if (window.notebookAPI) {
      const path = await window.notebookAPI.exportText(content, kind, name);
      if (path)
        onToast(
          kind === "md"
            ? "Markdown dışa aktarımı tamamlandı."
            : "CSV dışa aktarımı tamamlandı."
        );
      return;
    }
    download(
      content,
      kind === "md" ? "text/markdown" : "text/csv",
      name
    );
  }

  async function exportPdf() {
    if (!window.notebookAPI) {
      onToast("PDF dışa aktarma masaüstü sürümünde kullanılabilir.");
      return;
    }
    const path = await window.notebookAPI.exportPdf(
      dataToPrintableHtml(data),
      `Notebook-PC-${stamp()}.pdf`
    );
    if (path) onToast("PDF raporu oluşturuldu.");
  }

  async function importFiles() {
    if (!window.notebookAPI) {
      onToast("İçe aktarma masaüstü sürümünde kullanılabilir.");
      return;
    }
    try {
      const files = await window.notebookAPI.importFiles();
      if (!files.length) return;
      let next = data;
      let count = 0;
      for (const file of files) {
        if (file.type === "json") {
          const normalized = migrateAppData(JSON.parse(file.content));
          if (!normalized) throw new Error("Geçersiz JSON yedeği.");
          if (
            window.confirm(
              `${file.name} tam bir yedek. Mevcut veriler bununla değiştirilsin mi?`
            )
          ) {
            next = normalized;
            count += 1;
          }
        }
        if (file.type === "md") {
          next = {
            ...next,
            notes: [
              markdownFileToNote(file.name, file.content),
              ...next.notes
            ]
          };
          count += 1;
        }
        if (file.type === "csv") {
          next = mergeCsv(next, file.content);
          count += 1;
        }
        if (file.type === "pdf") {
          const attachment: PdfAttachment = {
            id: uid(),
            fileName: file.fileName,
            originalName: file.name,
            size: file.size,
            createdAt: new Date().toISOString(),
            annotations: []
          };
          next = {
            ...next,
            notes: [pdfFileToNote(file.name, attachment), ...next.notes]
          };
          count += 1;
        }
      }
      onDataChange(next);
      onToast(`${count} dosya Notebook-PC’ye aktarıldı.`);
    } catch (caught) {
      onToast(
        caught instanceof Error
          ? caught.message
          : "Dosyalar içe aktarılamadı."
      );
    }
  }

  return (
    <section className="settings-card span-two transfer-card">
      <div className="settings-card-head">
        <div className="card-icon green">
          <Icon name="download" size={22} />
        </div>
        <div>
          <h2>İçe ve dışa aktarma</h2>
          <p>
            Tüm verini yedekle, paylaşılabilir rapor oluştur veya başka
            dosyalardan içeri al.
          </p>
        </div>
      </div>
      <div className="format-actions">
        <button onClick={exportJson}>
          <strong>JSON</strong>
          <span>Tam yedek</span>
        </button>
        <button onClick={() => exportText("md")}>
          <strong>MD</strong>
          <span>Markdown</span>
        </button>
        <button onClick={() => exportText("csv")}>
          <strong>CSV</strong>
          <span>Tablolu veri</span>
        </button>
        <button onClick={exportPdf}>
          <strong>PDF</strong>
          <span>Okunabilir rapor</span>
        </button>
        <button className="import-format" onClick={importFiles}>
          <Icon name="upload" size={18} />
          <span>
            <strong>İçe aktar</strong>
            <small>JSON, MD, CSV veya PDF</small>
          </span>
        </button>
      </div>
    </section>
  );
}
