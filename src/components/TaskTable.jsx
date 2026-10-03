import { useMemo, useState } from "react";
import { TASK_STATUS } from "../utils/constants";
import { formatDate, isTaskOverdue } from "../utils/taskUtils";
import {
  saveProofFile,
  openProofFile,
  deleteProofFile,
} from "../services/proofService";

const priorityOrder = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function TaskTable({
  tasks,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onAddProof,
  onRemoveProof,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedTask, setExpandedTask] = useState(null);
  const [uploadingTask, setUploadingTask] = useState(null);

  const filteredTasks = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    const result = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search) ||
        task.subject.toLowerCase().includes(search);

      const matchesFilter =
        filter === "All" ||
        (filter === "Pending" &&
          task.status === TASK_STATUS.PENDING) ||
        (filter === "Completed" &&
          task.status === TASK_STATUS.COMPLETED) ||
        (filter === "Overdue" && isTaskOverdue(task));

      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => {
      if (sortBy === "dueDate") {
        return a.dueDate.localeCompare(b.dueDate);
      }

      if (sortBy === "priority") {
        return (
          (priorityOrder[b.priority] || 0) -
          (priorityOrder[a.priority] || 0)
        );
      }

      if (sortBy === "oldest") {
        return String(a.createdAt || a.id).localeCompare(
          String(b.createdAt || b.id)
        );
      }

      return String(b.createdAt || b.id).localeCompare(
        String(a.createdAt || a.id)
      );
    });
  }, [tasks, searchTerm, filter, sortBy]);

  const handleProofUpload = async (taskId, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Please choose a file smaller than 10 MB.");
      return;
    }

    setUploadingTask(taskId);

    try {
      const proof = {
        id: crypto.randomUUID(),
        name: file.name,
        uploadedAt: new Date().toISOString(),
      };

      await saveProofFile(proof.id, file);
      onAddProof(taskId, proof);
    } catch (error) {
      console.error(error);
      alert(
        "Could not save the file. Check your browser storage."
      );
    } finally {
      setUploadingTask(null);
    }
  };

  const handleProofDelete = async (taskId, proofId) => {
    if (!window.confirm("Remove this attachment?")) return;

    try {
      await deleteProofFile(proofId);
      onRemoveProof(taskId, proofId);
    } catch (error) {
      console.error(error);
      alert("Could not remove the attachment.");
    }
  };

  return (
    <section className="tasks-section">
      <div className="section-heading task-heading">
        <div>
          <h2>My Tasks</h2>
        </div>

        <div className="task-controls">
          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <select
            className="filter-select"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            aria-label="Filter tasks"
          >
            <option value="All">All Tasks</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value)
            }
            aria-label="Sort tasks"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">
              High Priority First
            </option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>

            <h3>No tasks found</h3>

            <p>
              {tasks.length === 0
                ? "Add your first task using the form above."
                : "Try changing your search or filter."}
            </p>
          </div>
        ) : (
          <table className="task-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Subject</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.map((task) => {
                const completed =
                  task.status === TASK_STATUS.COMPLETED;

                const overdue = isTaskOverdue(task);

                const expanded =
                  expandedTask === task.id;

                return (
                  <ReactFragmentRow
                    key={task.id}
                    task={task}
                    completed={completed}
                    overdue={overdue}
                    expanded={expanded}
                    uploading={
                      uploadingTask === task.id
                    }
                    onToggleComplete={
                      onToggleComplete
                    }
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onExpand={() =>
                      setExpandedTask(
                        expanded ? null : task.id
                      )
                    }
                    onUpload={handleProofUpload}
                    onOpenProof={openProofFile}
                    onDeleteProof={handleProofDelete}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function ReactFragmentRow({
  task,
  completed,
  overdue,
  expanded,
  uploading,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onExpand,
  onUpload,
  onOpenProof,
  onDeleteProof,
}) {
  return (
    <>
      <tr
        className={
          completed ? "completed-row" : ""
        }
      >
        {/* TASK */}
        <td>
          <div className="task-title-cell">
            <button
              className={`complete-check ${
                completed ? "checked" : ""
              }`}
              onClick={() =>
                onToggleComplete(task.id)
              }
              title={
                completed
                  ? "Mark as pending"
                  : "Mark as completed"
              }
            >
              {completed ? "✓" : ""}
            </button>

            <span
              className={
                completed
                  ? "task-completed"
                  : ""
              }
            >
              {task.title}
            </span>
          </div>
        </td>

        {/* SUBJECT */}
        <td>{task.subject}</td>

        {/* DUE DATE */}
        <td className="task-due-date-cell">
          <div
            className={
              overdue
                ? "due-date-content overdue"
                : "due-date-content"
            }
          >
            <span className="due-date-text">
              {formatDate(task.dueDate)}
            </span>

            {overdue && (
              <span className="overdue-label">
                Overdue
              </span>
            )}
          </div>
        </td>

        {/* PRIORITY */}
        <td>
          <span
            className={`priority-badge ${
              task.priority.toLowerCase()
            }`}
          >
            {task.priority}
          </span>
        </td>

        {/* STATUS */}
        <td>
          <span
            className={`status-badge ${
              completed
                ? "completed"
                : "pending"
            }`}
          >
            {task.status}
          </span>
        </td>

        {/* ACTIONS */}
        <td>
          <div className="action-buttons">
            <button
              className="edit-button"
              onClick={() =>
                onEditTask(task)
              }
              title="Edit task"
            >
              ✎
            </button>

            <button
              className="delete-button"
              onClick={() =>
                onDeleteTask(task.id)
              }
              title="Delete task"
            >
              🗑
            </button>

            <button
              className="details-button"
              onClick={onExpand}
              title="Assignment proof and history"
            >
              {expanded ? "Hide" : "Proof"}
            </button>
          </div>
        </td>
      </tr>

      {/* EXPANDED DETAILS */}
      {expanded && (
        <tr className="task-details-row">
          <td colSpan="6">
            <div className="task-details-panel">

              {/* ASSIGNMENT PROOF */}
              <div>
                <h3>Assignment Proof</h3>

                <label className="proof-upload-button">
                  {uploading
                    ? "Uploading..."
                    : "+ Attach File"}

                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    disabled={uploading}
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0];

                      if (file) {
                        onUpload(task.id, file);
                      }

                      event.target.value = "";
                    }}
                  />
                </label>

                {(task.proofs || []).length ===
                0 ? (
                  <p>
                    No proof attached yet.
                  </p>
                ) : (
                  <ul className="proof-list">
                    {task.proofs.map((proof) => (
                      <li key={proof.id}>
                        <span>
                          {proof.name}
                        </span>

                        <button
                          onClick={() =>
                            onOpenProof(
                              proof.id
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          onClick={() =>
                            onDeleteProof(
                              task.id,
                              proof.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* VERSION HISTORY */}
              <div className="version-history-section">
                <h3>Version History</h3>

                {(task.history || []).length ===
                0 ? (
                  <p className="history-empty">
                    Edit this task to create its
                    first version.
                  </p>
                ) : (
                  <ul className="history-list">
                    {[...task.history]
                      .reverse()
                      .map(
                        (
                          version,
                          index
                        ) => (
                          <li
                            key={`${version.savedAt}-${index}`}
                            className="history-item"
                          >
                            <div className="history-title">
                              {version.title}
                            </div>

                            <div className="history-details">
                              <span>
                                Subject:{" "}
                                {version.subject}
                              </span>

                              <span>
                                Due:{" "}
                                {formatDate(
                                  version.dueDate
                                )}
                              </span>

                              <span>
                                Priority:{" "}
                                {version.priority}
                              </span>
                            </div>

                            <small className="history-saved">
                              Saved:{" "}
                              {new Date(
                                version.savedAt
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </small>
                          </li>
                        )
                      )}
                  </ul>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default TaskTable;