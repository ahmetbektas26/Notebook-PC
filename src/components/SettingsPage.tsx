import { useEffect, useState } from "react";
import type { AppData } from "../types";
import { migrateAppData } from "../lib/data";
import Icon from "./Icon";

interface SettingsPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onToast: (message: string) => void;
}

export default function SettingsPage({
  data,
  onDataChange,
  onToast
}: SettingsPageProps) {
  const [storagePath, setStoragePath] = useState("Yerel uygulama verisi");
  const [launchAtLogin, setLaunchAtLogin] = useState(false);

  useEffect(() => {
    window.notebookAPI
      ?.getStoragePath()
      .then(setStoragePath)
      .catch(() => undefined);
    window.notebookAPI
      ?.getLaunchAtLogin()
      .then(setLaunchAtLogin)
      .catch(() => undefined);
  }, []);

  async function toggleLaunchAtLogin() {
    if (!window.notebookAPI) {
      onToast("Bu ayar masaüstü sürümünde kullanılabilir.");
      return;
    }
    const enabled = await window.notebookAPI.setLaunchAtLogin(!launchAtLogin);
    setLaunchAtLogin(enabled);
    onToast(
      enabled
        ? "Windows başlangıcında açılacak."
        : "Otomatik başlangıç kapatıldı."
    );
  }

  async function exportData() {
    if (window.notebookAPI) {
      const path = await window.notebookAPI.exportBackup(data);
      if (path) onToast("Yedek dosyası oluşturuldu.");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Notebook-PC-yedek.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importData() {
    if (!window.notebookAPI) {
      onToast("Yedek içe aktarma masaüstü sürümünde kullanılabilir.");
      return;
    }
    try {
      const imported = await window.notebookAPI.importBackup();
      if (!imported) return;
      const normalized = migrateAppData(imported);
      if (!normalized) {
        onToast("Bu dosya geçerli bir Notebook-PC yedeği değil.");
        return;
      }
      if (
        window.confirm(
          "Mevcut notlar yedekteki verilerle değiştirilecek. Devam edilsin mi?"
        )
      ) {
        onDataChange(normalized);
        onToast("Yedek başarıyla geri yüklendi.");
      }
    } catch {
      onToast("Yedek dosyası okunamadı.");
    }
  }

  return (
    <div className="page-scroll">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UYGULAMA</span>
          <h1>Ayarlar ve yedekleme</h1>
          <p>Görünümü değiştir, verilerinin nerede olduğunu gör ve yedek al.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-head">
            <div className="card-icon purple">
              <Icon
                name={data.settings.theme === "light" ? "sun" : "moon"}
                size={22}
              />
            </div>
            <div>
              <h2>Görünüm</h2>
              <p>Çalışma ortamına uygun temayı seç.</p>
            </div>
          </div>
          <div className="theme-picker">
            <button
              className={data.settings.theme === "light" ? "active" : ""}
              onClick={() =>
                onDataChange({
                  ...data,
                  settings: { ...data.settings, theme: "light" }
                })
              }
            >
              <span className="theme-preview light-preview">
                <i />
                <i />
              </span>
              <Icon name="sun" size={17} />
              Açık
            </button>
            <button
              className={data.settings.theme === "dark" ? "active" : ""}
              onClick={() =>
                onDataChange({
                  ...data,
                  settings: { ...data.settings, theme: "dark" }
                })
              }
            >
              <span className="theme-preview dark-preview">
                <i />
                <i />
              </span>
              <Icon name="moon" size={17} />
              Koyu
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <div className="card-icon green">
              <Icon name="download" size={22} />
            </div>
            <div>
              <h2>Yedekleme</h2>
              <p>Tüm ders, not, alarm ve ortalama verilerini JSON olarak sakla.</p>
            </div>
          </div>
          <div className="backup-actions">
            <button className="primary-button" onClick={exportData}>
              <Icon name="download" size={17} />
              Yedek dışa aktar
            </button>
            <button className="secondary-button" onClick={importData}>
              <Icon name="upload" size={17} />
              Yedekten geri yükle
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <div className="card-icon amber">
              <Icon name="bell" size={22} />
            </div>
            <div>
              <h2>Alarm sürekliliği</h2>
              <p>
                Bilgisayar açıldığında uygulamayı arka planda başlat; yaklaşan
                alarmlar hazır olsun.
              </p>
            </div>
          </div>
          <button
            className={`toggle-row ${launchAtLogin ? "active" : ""}`}
            onClick={toggleLaunchAtLogin}
          >
            <span>
              <strong>Windows ile başlat</strong>
              <small>Uygulama sistem tepsisinde sessizce açılır.</small>
            </span>
            <i>
              <b />
            </i>
          </button>
        </section>

        <section className="settings-card span-two">
          <div className="settings-card-head">
            <div className="card-icon amber">
              <Icon name="book" size={22} />
            </div>
            <div>
              <h2>Yerel veri alanı</h2>
              <p>
                Notebook-PC çevrimdışı çalışır. Notların ve ses kayıtların buluta
                gönderilmez.
              </p>
            </div>
          </div>
          <div className="storage-path">
            <span>Veri klasörü</span>
            <code>{storagePath}</code>
          </div>
          <div className="storage-stats">
            <div>
              <strong>{data.courses.length}</strong>
              <span>Ders</span>
            </div>
            <div>
              <strong>{data.notes.length}</strong>
              <span>Yazılı not</span>
            </div>
            <div>
              <strong>
                {data.notes.reduce((sum, note) => sum + note.audio.length, 0)}
              </strong>
              <span>Ses kaydı</span>
            </div>
            <div>
              <strong>{data.plannerItems.length}</strong>
              <span>Takvim kaydı</span>
            </div>
            <div>
              <strong>{data.goals.length}</strong>
              <span>Hedef</span>
            </div>
          </div>
        </section>
      </div>

      <div className="privacy-note">
        <Icon name="check" size={18} />
        <div>
          <strong>Önce gizlilik</strong>
          <span>
            Uygulama üyelik istemez; kişisel veriler yalnızca kendi bilgisayarında
            tutulur.
          </span>
        </div>
      </div>
    </div>
  );
}
