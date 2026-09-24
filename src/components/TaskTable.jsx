import { useMemo, useState } from "react";
import { TASK_STATUS } from "../utils/constants";
import { formatDate } from "../utils/taskUtils";

function TaskTable({
    tasks,
    onEditTask,
    onDeleteTask,
    onToggleComplete,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                task.title.toLowerCase().includes(search) ||
                task.subject.toLowerCase().includes(search);

            const matchesFilter =
                filter === "All" ||
                (filter === "Pending" &&
                    task.status === TASK_STATUS.PENDING) ||
                (filter === "Completed" &&
                    task.status === TASK_STATUS.COMPLETED);

            return matchesSearch && matchesFilter;
        });
    }, [tasks, searchTerm, filter]);

    const getPriorityClass = (priority) => {
        return priority.toLowerCase();
    };

    return (
        <section className="tasks-section">
            <div className="section-heading task-heading">
                <div>
                    <span className="section-label">TASK OVERVIEW</span>
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
                    >
                        <option value="All">All Tasks</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
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
                                const isCompleted =
                                    task.status === TASK_STATUS.COMPLETED;

                                return (
                                    <tr
                                        key={task.id}
                                        className={
                                            isCompleted
                                                ? "completed-row"
                                                : ""
                                        }
                                    >
                                        <td>
                                            <div className="task-title-cell">
                                                <button
                                                    className={`complete-check ${
                                                        isCompleted
                                                            ? "checked"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        onToggleComplete(
                                                            task.id
                                                        )
                                                    }
                                                    title={
                                                        isCompleted
                                                            ? "Mark as pending"
                                                            : "Mark as completed"
                                                    }
                                                >
                                                    {isCompleted ? "✓" : ""}
                                                </button>

                                                <span
                                                    className={
                                                        isCompleted
                                                            ? "task-completed"
                                                            : ""
                                                    }
                                                >
                                                    {task.title}
                                                </span>
                                            </div>
                                        </td>

                                        <td>{task.subject}</td>

                                        <td>
                                            {formatDate(task.dueDate)}
                                        </td>

                                        <td>
                                            <span
                                                className={`priority-badge ${getPriorityClass(
                                                    task.priority
                                                )}`}
                                            >
                                                {task.priority}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${
                                                    isCompleted
                                                        ? "completed"
                                                        : "pending"
                                                }`}
                                            >
                                                {task.status}
                                            </span>
                                        </td>

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
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

export default TaskTable;