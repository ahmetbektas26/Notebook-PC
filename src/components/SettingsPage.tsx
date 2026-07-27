import { useEffect, useState } from "react";
import type { AppData, SecurityStatus } from "../types";
import DataTransfer from "./DataTransfer";
import Icon from "./Icon";
import SecuritySettings from "./SecuritySettings";

interface SettingsPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onToast: (message: string) => void;
  securityStatus: SecurityStatus;
  onSecurityStatusChange: (status: SecurityStatus) => void;
  onLock: () => void;
}

export default function SettingsPage({
  data,
  onDataChange,
  onToast,
  securityStatus,
  onSecurityStatusChange,
  onLock
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
    try {
      const enabled = await window.notebookAPI.setLaunchAtLogin(!launchAtLogin);
      setLaunchAtLogin(enabled);
      onToast(
        enabled
          ? "Windows başlangıcında açılacak."
          : "Otomatik başlangıç kapatıldı."
      );
    } catch {
      onToast("Windows başlangıç ayarı değiştirilemedi.");
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

        <DataTransfer
          data={data}
          onDataChange={onDataChange}
          onToast={onToast}
        />

        <SecuritySettings
          data={data}
          status={securityStatus}
          onStatusChange={onSecurityStatusChange}
          onLock={onLock}
          onToast={onToast}
        />

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
              <strong>
                {data.notes.reduce(
                  (sum, note) => sum + note.attachments.length,
                  0
                )}
              </strong>
              <span>PDF eki</span>
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
            Uygulama üyelik istemez. Yerel kasa açıksa notların, PDF’lerin ve
            ses kayıtların cihazında şifreli tutulur.
          </span>
        </div>
      </div>
    </div>
  );
}
