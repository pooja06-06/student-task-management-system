import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import TaskForm from "../components/TaskForm";
import TaskTable from "../components/TaskTable";
import TaskCalendar from "../components/TaskCalendar";
import StudyProgress from "../components/StudyProgress";
import Notifications from "../components/Notifications";
import FocusTimer from "../components/FocusTimer";
import SmartNotes from "../components/SmartNotes";
import Flashcards from "../components/Flashcards";
import PDFManager from "../components/PDFManager";

import {
  getTasks,
  saveTasks,
} from "../services/taskService";

import {
  TASK_STATUS,
} from "../utils/constants";

import {
  isTaskOverdue,
} from "../utils/taskUtils";

import {
  getTaskReminder,
} from "../utils/reminderUtils";

import {
  getUserStorageKey,
} from "../services/authService";


/* =========================================================
   DATE HELPERS
   ========================================================= */

const dateKey = (date) => {
  const d = new Date(date);

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const today = () => dateKey(new Date());

const isDone = (task) =>
  task.status === TASK_STATUS.COMPLETED;


/* =========================================================
   DASHBOARD
   ========================================================= */

export default function Dashboard({
  currentUser,
  onLogout,
}) {
  const [tasks, setTasks] = useState(getTasks);

  const [activeSection, setActiveSection] =
    useState("dashboard");

  const [editingTask, setEditingTask] =
    useState(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // Desktop sidebar hide/show state
  const [sidebarHidden, setSidebarHidden] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [month, setMonth] =
    useState(() => new Date());


  /* =======================================================
     SIDEBAR TOGGLE
     ======================================================= */

  const handleSidebarToggle = () => {
    if (window.innerWidth <= 768) {
      // Mobile: open/close sidebar
      setSidebarOpen((previous) => !previous);
    } else {
      // Desktop: hide/show sidebar
      setSidebarHidden((previous) => !previous);
    }
  };


  /* =======================================================
     USER SETTINGS
     ======================================================= */

  const settingsKey =
    getUserStorageKey(
      "taskflow_ui_settings"
    );

  const [settings, setSettings] =
    useState(() => {
      try {
        const saved =
          JSON.parse(
            localStorage.getItem(
              settingsKey
            )
          );

        return (
          saved || {
            name:
              currentUser?.name || "",
            dailyGoal: 3,
          }
        );
      } catch {
        return {
          name:
            currentUser?.name || "",
          dailyGoal: 3,
        };
      }
    });


  /* =======================================================
     SAVE TASKS
     ======================================================= */

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);


  /* =======================================================
     SAVE SETTINGS
     ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      settingsKey,
      JSON.stringify(settings)
    );
  }, [settings, settingsKey]);


  /* =======================================================
     ESCAPE KEY
     ======================================================= */

  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setShowNotifications(false);
      }
    };

    window.addEventListener(
      "keydown",
      close
    );

    return () =>
      window.removeEventListener(
        "keydown",
        close
      );
  }, []);


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const navigate = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    setShowNotifications(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  /* =======================================================
     CREATE TASK
     ======================================================= */

  const newTask = (data) => {
    const task = {
      ...data,

      id: crypto.randomUUID(),

      status:
        TASK_STATUS.PENDING,

      proofs: [],

      history: [],

      createdAt:
        new Date().toISOString(),
    };

    setTasks((old) => [
      task,
      ...old,
    ]);

    setEditingTask(null);

    navigate("my-tasks");
  };


  /* =======================================================
     UPDATE TASK
     ======================================================= */

  const updateTask = (
    id,
    data
  ) => {
    setTasks((old) =>
      old.map((task) =>
        task.id === id
          ? {
              ...task,
              ...data,

              history: [
                ...(task.history || []),

                {
                  title:
                    task.title,

                  subject:
                    task.subject,

                  dueDate:
                    task.dueDate,

                  priority:
                    task.priority,

                  status:
                    task.status,

                  savedAt:
                    new Date().toISOString(),
                },
              ],
            }
          : task
      )
    );

    setEditingTask(null);

    navigate("my-tasks");
  };


  /* =======================================================
     EDIT TASK
     ======================================================= */

  const editTask = (task) => {
    setEditingTask(task);
    navigate("add-task");
  };


  /* =======================================================
     DELETE TASK
     ======================================================= */

  const deleteTask = (id) => {
    const confirmed =
      window.confirm(
        "Delete this task?"
      );

    if (!confirmed) {
      return;
    }

    setTasks((old) =>
      old.filter(
        (task) =>
          task.id !== id
      )
    );
  };


  /* =======================================================
     COMPLETE TASK
     ======================================================= */

  const toggleTask = (id) => {
    setTasks((old) =>
      old.map((task) =>
        task.id === id
          ? {
              ...task,

              status: isDone(task)
                ? TASK_STATUS.PENDING
                : TASK_STATUS.COMPLETED,
            }
          : task
      )
    );
  };


  /* =======================================================
     ADD PROOF
     ======================================================= */

  const addProof = (
    id,
    proof
  ) => {
    setTasks((old) =>
      old.map((task) =>
        task.id === id
          ? {
              ...task,

              proofs: [
                ...(task.proofs || []),
                proof,
              ],
            }
          : task
      )
    );
  };


  /* =======================================================
     REMOVE PROOF
     ======================================================= */

  const removeProof = (
    id,
    proofId
  ) => {
    setTasks((old) =>
      old.map((task) =>
        task.id === id
          ? {
              ...task,

              proofs: (
                task.proofs || []
              ).filter(
                (proof) =>
                  proof.id !== proofId
              ),
            }
          : task
      )
    );
  };


  /* =======================================================
     STATISTICS
     ======================================================= */

  const stats = useMemo(() => {
    const total =
      tasks.length;

    const completed =
      tasks.filter(isDone).length;

    const pending =
      tasks.filter(
        (task) =>
          !isDone(task)
      ).length;

    const week =
      tasks.filter((task) => {
        if (!task.dueDate) {
          return false;
        }

        const dueDate =
          new Date(
            `${task.dueDate}T12:00:00`
          );

        const now =
          new Date();

        const start =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

        const end =
          new Date(start);

        end.setDate(
          start.getDate() + 7
        );

        return (
          dueDate >= start &&
          dueDate <= end
        );
      }).length;

    return {
      total,
      completed,
      pending,
      week,
    };
  }, [tasks]);


  /* =======================================================
     REMINDERS
     ======================================================= */

  const reminders =
    tasks.filter(
      (task) =>
        !isDone(task) &&
        getTaskReminder(task)
    );


  /* =======================================================
     UPCOMING DEADLINES
     ======================================================= */

  const upcomingDeadlines =
    tasks
      .filter(
        (task) =>
          !isDone(task) &&
          task.dueDate
      )
      .sort((a, b) =>
        a.dueDate.localeCompare(
          b.dueDate
        )
      )
      .slice(0, 5);


  /* =======================================================
     TODAY'S TASKS
     ======================================================= */

  const todayTasks =
    tasks
      .filter(
        (task) =>
          !isDone(task) &&
          task.dueDate === today()
      )
      .slice(0, 5);


  /* =======================================================
     SEARCH
     ======================================================= */

  const matches =
    tasks.filter((task) => {
      const value = `
        ${task.title || ""}
        ${task.subject || ""}
      `.toLowerCase();

      return value.includes(
        search.toLowerCase()
      );
    });


  /* =======================================================
     CALENDAR DAYS
     ======================================================= */

  const calendarDays =
    useMemo(() => {
      const year =
        month.getFullYear();

      const monthNumber =
        month.getMonth();

      const totalDays =
        new Date(
          year,
          monthNumber + 1,
          0
        ).getDate();

      const firstDay =
        new Date(
          year,
          monthNumber,
          1
        ).getDay();

      return [
        ...Array(
          firstDay
        ).fill(null),

        ...Array.from(
          {
            length:
              totalDays,
          },
          (_, index) =>
            index + 1
        ),
      ];
    }, [month]);


  /* =======================================================
     MINI CALENDAR
     ======================================================= */

  const renderCalendar =
    () => (
      <div className="tf-calendar-mini">

        <div className="tf-calendar-head">

          <strong>
            {month.toLocaleDateString(
              "en-US",
              {
                month: "long",
                year: "numeric",
              }
            )}
          </strong>

          <span>

            <button
              type="button"
              onClick={() =>
                setMonth(
                  new Date(
                    month.getFullYear(),
                    month.getMonth() - 1,
                    1
                  )
                )
              }
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() =>
                setMonth(
                  new Date(
                    month.getFullYear(),
                    month.getMonth() + 1,
                    1
                  )
                )
              }
            >
              ›
            </button>

          </span>

        </div>


        <div className="tf-calendar-grid">

          {[
            "S",
            "M",
            "T",
            "W",
            "T",
            "F",
            "S",
          ].map(
            (
              day,
              index
            ) => (
              <small
                key={index}
              >
                {day}
              </small>
            )
          )}


          {calendarDays.map(
            (
              day,
              index
            ) => {
              const key =
                day
                  ? `${month.getFullYear()}-${String(
                      month.getMonth() + 1
                    ).padStart(
                      2,
                      "0"
                    )}-${String(
                      day
                    ).padStart(
                      2,
                      "0"
                    )}`
                  : "";

              const hasTask =
                tasks.some(
                  (task) =>
                    task.dueDate ===
                    key
                );

              return (
                <button
                  type="button"
                  key={index}
                  disabled={!day}
                  className={`
                    ${
                      key === today()
                        ? "today"
                        : ""
                    }

                    ${
                      hasTask
                        ? "has-task"
                        : ""
                    }
                  `}
                  title={
                    tasks
                      .filter(
                        (task) =>
                          task.dueDate ===
                          key
                      )
                      .map(
                        (task) =>
                          task.title
                      )
                      .join(", ")
                  }
                  onClick={() =>
                    navigate(
                      "calendar"
                    )
                  }
                >
                  {day || ""}
                </button>
              );
            }
          )}

        </div>
      </div>
    );


  /* =======================================================
     DASHBOARD HOME
     ======================================================= */

  const renderDashboard =
    () => (
      <div className="tf-dashboard-home">

        {/* STAT CARDS */}

        <div className="tf-stats-grid">

          <div className="tf-stat-card">

            <div className="tf-stat-icon purple">
              ▣
            </div>

            <div>
              <span>
                Total Tasks :
              </span>

              <strong>
                {stats.total}
              </strong>
            </div>

          </div>


          <div className="tf-stat-card">

            <div className="tf-stat-icon green">
              ✓
            </div>

            <div>
              <span>
                Completed :
              </span>

              <strong>
                {stats.completed}
              </strong>
            </div>

          </div>


          <div className="tf-stat-card">

            <div className="tf-stat-icon orange">
              ◷
            </div>

            <div>
              <span>
                Pending :
              </span>

              <strong>
                {stats.pending}
              </strong>
            </div>

          </div>


          <div className="tf-stat-card">

            <div className="tf-stat-icon blue">
              ▦
            </div>

            <div>
              <span>
                This Week :
              </span>

              <strong>
                {stats.week}
              </strong>
            </div>

          </div>

        </div>


        {/* MAIN DASHBOARD */}

        <div className="tf-dashboard-content">


          {/* LEFT */}

          <div className="tf-dashboard-left-column">


            {/* TODAY */}

            <section className="tf-panel tf-today-panel">

              <div className="tf-panel-title">

                <div>

                  <h3>
                    ☑ Today's Tasks
                  </h3>

                  <p>
                    Tasks scheduled for today
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "my-tasks"
                    )
                  }
                >
                  View all →
                </button>

              </div>


              {todayTasks.length > 0 ? (

                <div className="tf-today-list">

                  {todayTasks.map(
                    (task) => (
                      <label
                        className="tf-task-line"
                        key={task.id}
                      >

                        <input
                          type="checkbox"
                          checked={isDone(
                            task
                          )}
                          onChange={() =>
                            toggleTask(
                              task.id
                            )
                          }
                        />

                        <span>
                          {task.title}
                        </span>

                        <small>
                          {task.subject ||
                            "Task"}
                        </small>

                      </label>
                    )
                  )}

                </div>

              ) : (

                <div className="tf-empty-tasks">
                  <div className="tf-empty-title">
                    ✓ <span>No tasks due today</span>
                  </div>

                  <div className="tf-empty-subtitle">
                    You're all caught up!
                  </div>
                </div>

              )}


              <button
                type="button"
                className="tf-text-button"
                onClick={() =>
                  navigate(
                    "add-task"
                  )
                }
              >
                ＋ Add task
              </button>

            </section>


            {/* CALENDAR */}

            <section className="tf-panel tf-calendar-panel">

              <div className="tf-panel-title">

                <div>

                  <h3>
                    ▦ Calendar
                  </h3>

                  <p>
                    Your upcoming schedule
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "calendar"
                    )
                  }
                >
                  View all →
                </button>

              </div>

              {renderCalendar()}

            </section>

          </div>


          {/* RIGHT */}

          <div className="tf-dashboard-right-column">

            <section className="tf-panel tf-deadlines-panel">

              <div className="tf-panel-title">

                <div>

                  <h3>
                    ▣ Upcoming Deadlines
                  </h3>

                  <p>
                    Keep an eye on what's next
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "my-tasks"
                    )
                  }
                >
                  View all →
                </button>

              </div>


              {upcomingDeadlines.length >
              0 ? (

                <div className="tf-deadline-list">

                  {upcomingDeadlines.map(
                    (task) => {

                      const overdue =
                        isTaskOverdue(
                          task
                        );

                      return (
                        <button
                          type="button"
                          key={task.id}
                          className={`
                            tf-dashboard-deadline
                            ${
                              overdue
                                ? "is-overdue"
                                : ""
                            }
                          `}
                          onClick={() =>
                            navigate(
                              "my-tasks"
                            )
                          }
                        >

                          <span
                            className={`
                              tf-deadline-indicator
                              ${
                                overdue
                                  ? "overdue"
                                  : ""
                              }
                            `}
                          />

                          <span className="tf-deadline-details">

                            <strong>
                              {task.title}
                            </strong>

                            <small>
                              {task.subject ||
                                "Task"}
                            </small>

                            <span
                              className={`
                                tf-deadline-date
                                ${
                                  overdue
                                    ? "overdue"
                                    : ""
                                }
                              `}
                            >

                              {overdue
                                ? "⚠ Overdue · "
                                : "Due · "}

                              {task.dueDate}

                            </span>

                          </span>

                        </button>
                      );
                    }
                  )}

                </div>

              ) : (

                <div className="tf-empty-tasks">
                  <div className="tf-empty-title">
                    ✓ <span>No upcoming deadlines</span>
                  </div>

                  <div className="tf-empty-subtitle">
                    You're all caught up!
                  </div>
                </div>

              )}

            </section>

          </div>

        </div>

      </div>
    );


  /* =======================================================
     PAGE WRAPPER
     ======================================================= */

  const page = (
    title,
    subtitle,
    child,
    action
  ) => (
    <div className="tf-page">

      <div className="tf-page-head">

        <div>

          <h1>
            {title}
          </h1>

          <p>
            {subtitle}
          </p>

        </div>

        {action}

      </div>

      {child}

    </div>
  );


  /* =======================================================
     CONTENT
     ======================================================= */

  const content = () => {

    switch (
      activeSection
    ) {


      /* ================= DASHBOARD ================= */

      case "dashboard":

        return renderDashboard();


      /* ================= MY TASKS ================= */

      case "my-tasks":

        return page(
          "My Tasks",
          "Manage assignments and deadlines",

          <TaskTable
            tasks={matches}
            onEditTask={
              editTask
            }
            onDeleteTask={
              deleteTask
            }
            onToggleComplete={
              toggleTask
            }
            onAddProof={
              addProof
            }
            onRemoveProof={
              removeProof
            }
          />,

          <button
            type="button"
            className="tf-primary"
            onClick={() =>
              navigate(
                "add-task"
              )
            }
          >
            ＋ Add Task
          </button>
        );


      /* ================= ADD TASK ================= */

      case "add-task":

        return page(
          editingTask
            ? "Edit Task"
            : "Create Task",

          editingTask
            ? "Update your assignment details"
            : "Organize your next assignment",

          <TaskForm
            onAddTask={
              newTask
            }
            onUpdateTask={
              updateTask
            }
            editingTask={
              editingTask
            }
            onCancelEdit={() => {
              setEditingTask(
                null
              );

              navigate(
                "my-tasks"
              );
            }}
          />
        );


      /* ================= CALENDAR ================= */

      case "calendar":

        return page(
          "Calendar",
          "Your tasks and important dates",

          <TaskCalendar
            tasks={tasks}
          />
        );


      /* ================= NOTES ================= */

      case "notes":

        return page(
          "Notes",
          "Write and organize your study notes",

          <SmartNotes />
        );


      /* ================= QUIZZES ================= */

      case "quizzes":

        return page(
          "Quizzes & Flashcards",
          "Practice and test your knowledge",

          <Flashcards />
        );


      /* ================= FOCUS TIMER ================= */

      case "focus-timer":

        return page(
          "Focus Timer",
          "Stay focused with timed study sessions",

          <FocusTimer />
        );


      /* ================= ANALYTICS ================= */

      case "analytics":

        return page(
          "Analytics",
          "Track your study and task progress",

          <StudyProgress
            tasks={tasks}
          />
        );


      /* ================= PDF MANAGER ================= */

      case "pdf-manager":

        return page(
          "PDF Manager",
          "Upload a PDF and generate AI study material",

          <PDFManager
            onOpenQuizzes={() =>
              navigate(
                "quizzes"
              )
            }
          />
        );


      /* ================= AI ASSISTANT ================= */

      case "ai-assistant":

        return page(
          "AI Study Assistant",
          "Plan, explain and revise",

          <section className="tf-panel tf-page-panel">

            <h3>
              AI Study Assistant
            </h3>

            <p className="tf-muted">
              Use your PDF study material,
              flashcards and quizzes to
              make revision easier.
            </p>

            <div className="tf-assistant-chips">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "pdf-manager"
                  )
                }
              >
                Generate from PDF
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "quizzes"
                  )
                }
              >
                Practice quizzes
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "notes"
                  )
                }
              >
                Create notes
              </button>

            </div>

          </section>
        );


      /* ================= SETTINGS ================= */

      case "settings":

        return page(
          "Settings",
          "Manage your TaskFlow account",

          <section className="tf-panel tf-page-panel tf-settings">

            <div className="tf-settings-section">

              <h3>
                Profile
              </h3>

              <p className="tf-muted">
                Update the information
                displayed in TaskFlow.
              </p>

              <label>
                Display name

                <input
                  value={
                    settings.name
                  }
                  maxLength={40}
                  onChange={(event) =>
                    setSettings(
                      (current) => ({
                        ...current,

                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                Email address

                <input
                  value={
                    currentUser?.email ||
                    ""
                  }
                  disabled
                />
              </label>

            </div>


            <div className="tf-settings-section">

              <h3>
                Account
              </h3>

              <p className="tf-muted">
                You are signed in as{" "}
                <strong>
                  {currentUser?.email}
                </strong>
              </p>

              <div className="tf-settings-account">

                <div>

                  <span>
                    Account email
                  </span>

                  <strong>
                    {currentUser?.email}
                  </strong>

                </div>

                <button
                  type="button"
                  className="tf-danger-button"
                  onClick={() => {

                    const confirmed =
                      window.confirm(
                        "Are you sure you want to log out?"
                      );

                    if (confirmed) {
                      onLogout();
                    }

                  }}
                >
                  Log Out
                </button>

              </div>

            </div>

          </section>
        );


      default:

        return renderDashboard();
    }
  };


  /* =======================================================
     FINAL LAYOUT
     ======================================================= */

  return (
    <div
      className={`
        app-layout
        tf-app
        ${sidebarOpen ? "tf-menu-open" : ""}
        ${sidebarHidden ? "tf-sidebar-hidden" : ""}
      `}
    >

      {/* SIDEBAR */}

      <Sidebar
        activeSection={
          activeSection
        }

        onNavigate={
          navigate
        }

        onClose={() =>
          setSidebarOpen(false)
        }

        studentName={
          settings.name ||
          currentUser?.name ||
          "Student"
        }
      />


      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          className="tf-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
          aria-label="Close menu"
        />
      )}


      {/* MAIN */}

      <main className="main-content tf-main">


        {/* TOP BAR */}

        <header className="tf-topbar">

          <button
            type="button"
            className="tf-menu-toggle"
            onClick={handleSidebarToggle}
            aria-label={
              sidebarHidden
                ? "Show sidebar"
                : "Hide sidebar"
            }
            title={
              sidebarHidden
                ? "Show sidebar"
                : "Hide sidebar"
            }
          >
            ☰
          </button>


          {/* SEARCH */}

          <div className="tf-global-search">

            <span>
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
              onFocus={() => {

                if (
                  activeSection ===
                  "dashboard"
                ) {
                  setActiveSection(
                    "my-tasks"
                  );
                }

              }}
              placeholder="Search tasks, subjects..."
            />

          </div>


          {/* NOTIFICATIONS */}

          <button
            type="button"
            className="tf-bell"
            onClick={() =>
              setShowNotifications(
                (value) =>
                  !value
              )
            }
            aria-label="Notifications"
          >

            🔔

            {reminders.length >
              0 && (
              <i>
                {reminders.length}
              </i>
            )}

          </button>


          {/* USER */}

          <button
            type="button"
            className="tf-user"
            onClick={() =>
              navigate(
                "settings"
              )
            }
          >

            👩🏻‍🎓{" "}

            {settings.name ||
              currentUser?.name ||
              "Student"}

            ⌄

          </button>

        </header>


        {/* NOTIFICATIONS */}

        {showNotifications && (
          <div className="tf-notification-popover">

            <div className="tf-panel-title">

              <h3>
                Notifications
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowNotifications(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <Notifications
              tasks={tasks}
              onViewTask={() =>
                navigate(
                  "my-tasks"
                )
              }
            />

          </div>
        )}


        {/* PAGE CONTENT */}

        {content()}

      </main>

    </div>
  );
}