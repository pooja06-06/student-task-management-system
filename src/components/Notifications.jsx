import { useMemo } from "react";
import { getTaskReminder } from "../utils/reminderUtils";

function Notifications({ tasks, onViewTask }) {
  const reminders = useMemo(() => {
    return tasks
      .map((task) => ({
        task,
        reminder: getTaskReminder(task),
      }))
      .filter((item) => item.reminder !== null)
      .sort(
        (a, b) =>
          a.task.dueDate.localeCompare(b.task.dueDate)
      );
  }, [tasks]);

  return (
    <section className="notifications-section">
      <div className="section-heading">
        <div>
          <span className="section-label">DEADLINE ALERTS</span>
          <h2>Notifications</h2>
          <p>
            You have {reminders.length} task reminder(s).
          </p>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>You're all caught up!</h3>
          <p>No upcoming deadlines or overdue tasks.</p>
        </div>
      ) : (
        <div className="notification-list">
          {reminders.map(({ task, reminder }) => (
            <div
              key={task.id}
              className={`notification-card ${reminder.type}`}
            >
              <div className="notification-icon">
                {reminder.type === "overdue" ? "⚠️" : "🔔"}
              </div>

              <div className="notification-details">
                <h3>{task.title}</h3>
                <p>{task.subject}</p>
                <span>{reminder.message}</span>
              </div>

              <button
                className="notification-view-button"
                onClick={onViewTask}
              >
                View Task
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Notifications;