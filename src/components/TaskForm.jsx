import { useEffect, useState } from "react";
import { PRIORITIES } from "../utils/constants";

function TaskForm({
    onAddTask,
    onUpdateTask,
    editingTask,
    onCancelEdit
}) {
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState("Medium");

    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title);
            setSubject(editingTask.subject);
            setDueDate(editingTask.dueDate);
            setPriority(editingTask.priority);
        } else {
            resetForm();
        }
    }, [editingTask]);

    const resetForm = () => {
        setTitle("");
        setSubject("");
        setDueDate("");
        setPriority("Medium");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!title.trim() || !subject.trim() || !dueDate) {
            alert("Please fill in all required fields.");
            return;
        }

        const taskData = {
            title: title.trim(),
            subject: subject.trim(),
            dueDate,
            priority,
        };

        if (editingTask) {
            onUpdateTask(editingTask.id, taskData);
        } else {
            onAddTask(taskData);
        }

        resetForm();
    };

    const handleCancel = () => {
        resetForm();
        onCancelEdit();
    };

    return (
        <section className="task-form-section">
            <div className="section-heading">
                <div>
                    <span className="section-label">
                        TASK MANAGEMENT
                    </span>

                    <h2>
                        {editingTask ? "Edit Task" : "Add New Task"}
                    </h2>
                </div>

            </div>

            <form id="task-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="task-title">
                        Task Title <span>*</span>
                    </label>

                    <input
                        id="task-title"
                        type="text"
                        placeholder="e.g. Complete Java Assignment"
                        value={title}
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="task-subject">
                        Subject <span>*</span>
                    </label>

                    <input
                        id="task-subject"
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={subject}
                        onChange={(event) =>
                            setSubject(event.target.value)
                        }
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="task-due-date">
                            Due Date <span>*</span>
                        </label>

                        <input
                            id="task-due-date"
                            type="date"
                            value={dueDate}
                            onChange={(event) =>
                                setDueDate(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="task-priority">
                            Priority
                        </label>

                        <select
                            id="task-priority"
                            value={priority}
                            onChange={(event) =>
                                setPriority(event.target.value)
                            }
                        >
                            {PRIORITIES.map((item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* FORM ACTIONS */}
                <div className="tf-task-form-actions">
                    <button
                        type="submit"
                        className="tf-update-task-btn"
                    >
                        {editingTask
                            ? "Update Task"
                            : "Add Task"}
                    </button>

                    {editingTask && (
                        <button
                            type="button"
                            className="tf-cancel-task-btn"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </section>
    );

}

export default TaskForm;