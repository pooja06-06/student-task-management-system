import { useMemo, useState } from "react";
import { isTaskOverdue } from "../utils/taskUtils";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function TaskCalendar({ tasks = [] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const day = index - firstDay + 1;
      return day > 0 && day <= daysInMonth ? day : null;
    });
  }, [year, month]);

  const changeMonth = (difference) => {
    setCurrentMonth(new Date(year, month + difference, 1));
  };

  const today = new Date();
  const todayKey = dateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const monthLabel = currentMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="tf-fullcal">
      <div className="tf-fullcal-card">
        <div className="tf-fullcal-header">
          <div className="tf-fullcal-heading">
            <div className="tf-fullcal-icon">▦</div>
            <div>
              <h2>Calendar</h2>
              <p>Plan your tasks and keep track of important dates</p>
            </div>
          </div>
        </div>

        <div className="tf-fullcal-toolbar">
          <div className="tf-fullcal-month">
            <button
              type="button"
              className="tf-fullcal-nav"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              ‹
            </button>

            <h3>{monthLabel}</h3>

            <button
              type="button"
              className="tf-fullcal-nav"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <button
            type="button"
            className="tf-fullcal-today"
            onClick={() =>
              setCurrentMonth(
                new Date(today.getFullYear(), today.getMonth(), 1)
              )
            }
          >
            Today
          </button>
        </div>

        <div className="tf-fullcal-grid">
          {weekdays.map((day) => (
            <div className="tf-fullcal-weekday" key={day}>
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  className="tf-fullcal-day tf-fullcal-empty"
                  key={`empty-${index}`}
                />
              );
            }

            const dayKey = dateKey(year, month, day);
            const dayTasks = tasks.filter(
              (task) => task.dueDate === dayKey
            );
            const isToday = dayKey === todayKey;

            return (
              <div
                key={dayKey}
                className={`tf-fullcal-day ${
                  isToday ? "tf-fullcal-is-today" : ""
                }`}
              >
                <span className="tf-fullcal-date">
                  {day}
                </span>

                {isToday && (
                  <span className="tf-fullcal-today-label">
                    Today
                  </span>
                )}

                <div className="tf-fullcal-task-list">
                  {dayTasks.map((task) => {
                    const completed = task.status === "Completed";
                    const overdue = !completed && isTaskOverdue(task);

                    return (
                      <div
                        key={task.id}
                        className={`tf-fullcal-task ${
                          completed
                            ? "tf-fullcal-completed"
                            : overdue
                            ? "tf-fullcal-overdue"
                            : ""
                        }`}
                        title={`${task.title} — ${task.subject || ""}`}
                      >
                        <span className="tf-fullcal-dot" />
                        <span className="tf-fullcal-task-title">
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {dayTasks.length > 2 && (
                  <span className="tf-fullcal-more">
                    {dayTasks.length} tasks
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="tf-fullcal-legend">
          <span><i className="tf-legend-dot tf-legend-pending" /> Pending</span>
          <span><i className="tf-legend-dot tf-legend-completed" /> Completed</span>
          <span><i className="tf-legend-dot tf-legend-overdue" /> Overdue</span>
        </div>
      </div>
    </section>
  );
}

export default TaskCalendar;