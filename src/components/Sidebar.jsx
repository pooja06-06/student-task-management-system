const MENU_ITEMS = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "my-tasks", icon: "☑", label: "My Tasks" },
  { id: "calendar", icon: "▣", label: "Calendar" },
  { id: "notes", icon: "▤", label: "Notes" },
  { id: "pdf-manager", icon: "📄", label: "PDF Manager" },
  { id: "focus-timer", icon: "⏱", label: "Focus Timer" },
  { id: "analytics", icon: "▥", label: "Analytics" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

export default function Sidebar({
  activeSection = "dashboard",
  onNavigate = () => {},
  onClose = () => {},
  studentName = "Pooja",
}) {
  return (
    <aside className="tf-sidebar">
      <div className="tf-brand">
        <span className="tf-brand-logo">🎓</span>

        <div>
          <h2>TaskFlow</h2>
          <p>Student Portal</p>
        </div>

        <button
          type="button"
          className="tf-close-sidebar"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>

      <nav className="tf-sidebar-nav" aria-label="Main navigation">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tf-nav-link ${
              activeSection === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
            aria-current={
              activeSection === item.id ? "page" : undefined
            }
          >
            <span className="tf-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="tf-sidebar-footer">
        <div className="tf-sidebar-message">
          ✨ Small steps lead to big achievements.
        </div>

        <div className="tf-sidebar-profile">
          <span className="tf-profile-avatar">👩🏻‍🎓</span>

          <div>
            <strong>{studentName}</strong>
            <small>Student</small>
          </div>
        </div>
      </div>
    </aside>
  );
}