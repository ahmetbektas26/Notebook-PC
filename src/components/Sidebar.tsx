import type { Page } from "../types";
import Icon from "./Icon";

interface SidebarProps {
  page: Page;
  onPageChange: (page: Page) => void;
  locked: boolean;
}

const navItems: Array<{ page: Page; label: string; icon: Parameters<typeof Icon>[0]["name"] }> = [
  { page: "today", label: "Bugün", icon: "home" },
  { page: "calendar", label: "Takvim", icon: "calendar" },
  { page: "review", label: "Haftalık bakış", icon: "weekly" },
  { page: "goals", label: "Kişisel hedefler", icon: "target" },
  { page: "notes", label: "Not defteri", icon: "book" },
  { page: "templates", label: "Şablonlar", icon: "template" },
  { page: "school", label: "Okul", icon: "school" },
  { page: "settings", label: "Ayarlar", icon: "settings" }
];

export default function Sidebar({
  page,
  onPageChange,
  locked
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>Notebook</strong>
          <small>PC</small>
        </div>
      </div>

      <nav className="primary-nav" aria-label="Ana menü">
        {navItems.map((item) => (
          <button
            key={item.page}
            className={page === item.page ? "active" : ""}
            onClick={() => onPageChange(item.page)}
          >
            <Icon name={item.icon} size={19} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-philosophy">
        <span className="eyebrow">TEK ALAN, TÜM HAYATIN</span>
        <p>Planların, hedeflerin, notların ve okulun birbirine karışmadan yanında.</p>
      </div>

      <div className="sidebar-foot">
        <div className="avatar">
          <Icon name={locked ? "lock" : "home"} size={15} />
        </div>
        <div>
          <strong>Yerel profil</strong>
          <span>{locked ? "Yerel kasa açık" : "Veriler bu cihazda"}</span>
        </div>
        <span className="online-dot" />
      </div>
    </aside>
  );
}
