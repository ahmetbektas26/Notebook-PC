import { useState } from "react";
import type { AppData, SecurityStatus } from "../types";
import Icon from "./Icon";

interface SecuritySettingsProps {
  data: AppData;
  status: SecurityStatus;
  onStatusChange: (status: SecurityStatus) => void;
  onLock: () => void;
  onToast: (message: string) => void;
}

export default function SecuritySettings({
  data,
  status,
  onStatusChange,
  onLock,
  onToast
}: SecuritySettingsProps) {
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [disablePasscode, setDisablePasscode] = useState("");
  const [busy, setBusy] = useState(false);

  async function enable(event: React.FormEvent) {
    event.preventDefault();
    if (passcode.length < 6) {
      onToast("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (passcode !== confirm) {
      onToast("Yazdığın şifreler eşleşmiyor.");
      return;
    }
    try {
      setBusy(true);
      const next = await window.notebookAPI?.enableSecurity(
        passcode,
        data,
        5
      );
      if (!next) throw new Error();
      onStatusChange(next);
      setPasscode("");
      setConfirm("");
      onToast("Yerel kasa etkinleştirildi; veriler şifrelendi.");
    } catch {
      onToast("Şifreleme etkinleştirilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function disable(event: React.FormEvent) {
    event.preventDefault();
    try {
      setBusy(true);
      const next = await window.notebookAPI?.disableSecurity(
        disablePasscode,
        data
      );
      if (!next) throw new Error();
      onStatusChange(next);
      setDisablePasscode("");
      onToast("Uygulama kilidi ve yerel şifreleme kapatıldı.");
    } catch {
      onToast("Şifre yanlış veya güvenlik kapatma işlemi tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function changeAutoLock(minutes: number) {
    try {
      const next = await window.notebookAPI?.setAutoLock(minutes);
      if (!next) throw new Error();
      onStatusChange(next);
    } catch {
      onToast("Otomatik kilit süresi kaydedilemedi.");
    }
  }

  return (
    <section className="settings-card span-two security-card">
      <div className="settings-card-head">
        <div className="card-icon purple">
          <Icon name={status.enabled ? "lock" : "unlock"} size={22} />
        </div>
        <div>
          <h2>Uygulama kilidi ve yerel kasa</h2>
          <p>
            JSON verisini, ses kayıtlarını ve PDF dosyalarını AES-256 ile
            şifrele.
          </p>
        </div>
        <span className={`security-badge ${status.enabled ? "active" : ""}`}>
          {status.enabled ? "KORUNUYOR" : "KAPALI"}
        </span>
      </div>

      {!status.enabled ? (
        <form className="security-form" onSubmit={enable}>
          <div>
            <label>
              Yeni şifre
              <input
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                placeholder="En az 6 karakter"
                autoComplete="new-password"
                maxLength={128}
              />
            </label>
            <label>
              Şifreyi tekrar yaz
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Aynı şifre"
                autoComplete="new-password"
                maxLength={128}
              />
            </label>
          </div>
          <button className="primary-button" type="submit" disabled={busy}>
            <Icon name="lock" size={16} />
            Yerel kasayı aç
          </button>
          <small>
            Şifreni unutursan veriler kurtarılamaz. Önce JSON yedeği almanı
            öneririz.
          </small>
        </form>
      ) : (
        <div className="security-enabled">
          <label>
            Otomatik kilitle
            <select
              value={status.autoLockMinutes}
              onChange={(event) => changeAutoLock(Number(event.target.value))}
            >
              <option value="0">Yalnızca uygulama gizlendiğinde</option>
              <option value="1">1 dakika hareketsizlikte</option>
              <option value="5">5 dakika hareketsizlikte</option>
              <option value="15">15 dakika hareketsizlikte</option>
              <option value="30">30 dakika hareketsizlikte</option>
            </select>
          </label>
          <button
            className="secondary-button"
            onClick={async () => {
              try {
                const locked = await window.notebookAPI?.lockNow();
                if (!locked) throw new Error();
                onLock();
              } catch {
                onToast("Uygulama kilitlenemedi.");
              }
            }}
          >
            <Icon name="lock" size={16} />
            Şimdi kilitle
          </button>
          <form onSubmit={disable}>
            <input
              type="password"
              value={disablePasscode}
              onChange={(event) => setDisablePasscode(event.target.value)}
              placeholder="Kapatmak için mevcut şifre"
              autoComplete="current-password"
              maxLength={128}
            />
            <button type="submit" disabled={busy}>
              Şifrelemeyi kapat
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
