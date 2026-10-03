
import { useMemo } from "react";
import { TASK_STATUS } from "../utils/constants";   

export default function StudyProgress({ tasks = [] }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === TASK_STATUS.COMPLETED
    ).length;

    const pending = total - completed;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = tasks.filter((task) => {
      if (
        task.status === TASK_STATUS.COMPLETED ||
        !task.dueDate
      ) {
        return false;
      }

      const due = new Date(`${task.dueDate}T00:00:00`);
      return due < today;
    }).length;

    const completionRate = total
      ? Math.round((completed / total) * 100)
      : 0;

    const subjects = {};

    tasks.forEach((task) => {
      const subject = task.subject?.trim() || "Other";

      if (!subjects[subject]) {
        subjects[subject] = {
          total: 0,
          completed: 0,
        };
      }

      subjects[subject].total += 1;

      if (task.status === TASK_STATUS.COMPLETED) {
        subjects[subject].completed += 1;
      }
    });

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate,
      subjects: Object.entries(subjects).map(
        ([name, values]) => ({
          name,
          ...values,
          percentage: Math.round(
            (values.completed / values.total) * 100
          ),
        })
      ),
    };
  }, [tasks]);

  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      icon: "📋",
      color: "purple",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: "✅",
      color: "green",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: "⏳",
      color: "orange",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: "⚠️",
      color: "red",
    },
  ];

  return (
    <section className="analytics-section">
      <div className="analytics-stats">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`analytics-stat-card ${card.color}`}
          >
            <div className="analytics-stat-icon">
              {card.icon}
            </div>

            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="analytics-content">
        <article className="analytics-panel">
          <h3>Overall Completion</h3>
          <p>Your task completion progress</p>

          <div className="analytics-circle">
            <div
              className="analytics-circle-progress"
              style={{
                background: `conic-gradient(
                  #6959e8 ${stats.completionRate}%,
                  #e9e7f6 ${stats.completionRate}%
                )`,
              }}
            >
              <div className="analytics-circle-inner">
                <strong>
                  {stats.completionRate}%
                </strong>
                <span>Completed</span>
              </div>
            </div>
          </div>

          <div className="analytics-completion-details">
            <div>
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>

            <div>
              <span>Remaining</span>
              <strong>{stats.pending}</strong>
            </div>
          </div>
        </article>

        <article className="analytics-panel">
          <h3>Subject-wise Progress</h3>
          <p>Completion progress for each subject</p>

          {stats.subjects.length === 0 ? (
            <div className="analytics-empty">
              No tasks yet. Add tasks to see your
              progress.
            </div>
          ) : (
            <div className="analytics-subjects">
              {stats.subjects.map((subject) => (
                <div
                  key={subject.name}
                  className="analytics-subject"
                >
                  <div className="analytics-subject-heading">
                    <strong>{subject.name}</strong>
                    <span>
                      {subject.completed}/
                      {subject.total} tasks
                    </span>
                  </div>

                  <div className="analytics-progress-track">
                    <div
                      className="analytics-progress-fill"
                      style={{
                        width: `${subject.percentage}%`,
                      }}
                    />
                  </div>

                  <small>
                    {subject.percentage}% completed
                  </small>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}