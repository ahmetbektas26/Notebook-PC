import type { Course, Page } from "../types";
import Icon from "./Icon";

interface SidebarProps {
  page: Page;
  onPageChange: (page: Page) => void;
  courses: Course[];
  activeCourseId: string | null;
  onCourseChange: (courseId: string | null) => void;
  onAddCourse: () => void;
}

const navItems: Array<{ page: Page; label: string; icon: Parameters<typeof Icon>[0]["name"] }> = [
  { page: "notes", label: "Notlarım", icon: "book" },
  { page: "reminders", label: "Planlayıcı", icon: "calendar" },
  { page: "grades", label: "Not ortalaması", icon: "chart" },
  { page: "settings", label: "Ayarlar", icon: "settings" }
];

export default function Sidebar({
  page,
  onPageChange,
  courses,
  activeCourseId,
  onCourseChange,
  onAddCourse
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

      <div className="course-heading">
        <span>DERSLER</span>
        <button onClick={onAddCourse} aria-label="Ders ekle">
          <Icon name="plus" size={16} />
        </button>
      </div>
      <div className="course-list">
        <button
          className={page === "notes" && activeCourseId === null ? "active" : ""}
          onClick={() => {
            onPageChange("notes");
            onCourseChange(null);
          }}
        >
          <span className="course-dot all" />
          Tüm notlar
          <small>{courses.length}</small>
        </button>
        {courses.map((course) => (
          <button
            key={course.id}
            className={
              page === "notes" && activeCourseId === course.id ? "active" : ""
            }
            onClick={() => {
              onPageChange("notes");
              onCourseChange(course.id);
            }}
          >
            <span
              className="course-dot"
              style={{ backgroundColor: course.color }}
            />
            <span className="truncate">{course.name}</span>
            <small>{course.code}</small>
          </button>
        ))}
      </div>

      <div className="sidebar-foot">
        <div className="avatar">AB</div>
        <div>
          <strong>Ahmet Bektaş</strong>
          <span>Yerel çalışma alanı</span>
        </div>
        <span className="online-dot" />
      </div>
    </aside>
  );
}
