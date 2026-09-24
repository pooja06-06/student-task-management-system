import { useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import WelcomeBanner from "../components/WelcomeBanner";
import StatCard from "../components/StatCard";
import TaskForm from "../components/TaskForm";
import TaskTable from "../components/TaskTable";

import { getTasks, saveTasks } from "../services/taskService";
import { TASK_STATUS } from "../utils/constants";

function Dashboard() {
    const [tasks, setTasks] = useState(() => getTasks());
    const [editingTask, setEditingTask] = useState(null);

    const updateTasks = (updatedTasks) => {
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
    };

    const addTask = (taskData) => {
        const newTask = {
            id: Date.now(),
            ...taskData,
            status: TASK_STATUS.PENDING,
        };

        updateTasks([newTask, ...tasks]);
    };

    const updateTask = (id, taskData) => {
        const updatedTasks = tasks.map((task) =>
            task.id === id
                ? {
                      ...task,
                      ...taskData,
                  }
                : task
        );

        updateTasks(updatedTasks);
        setEditingTask(null);
    };

    const deleteTask = (id) => {
        const shouldDelete = window.confirm(
            "Are you sure you want to delete this task?"
        );

        if (!shouldDelete) return;

        const updatedTasks = tasks.filter(
            (task) => task.id !== id
        );

        updateTasks(updatedTasks);

        if (editingTask?.id === id) {
            setEditingTask(null);
        }
    };

    const toggleComplete = (id) => {
        const updatedTasks = tasks.map((task) =>
            task.id === id
                ? {
                      ...task,
                      status:
                          task.status === TASK_STATUS.COMPLETED
                              ? TASK_STATUS.PENDING
                              : TASK_STATUS.COMPLETED,
                  }
                : task
        );

        updateTasks(updatedTasks);
    };

    const startEditing = (task) => {
        setEditingTask(task);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const statistics = useMemo(() => {
        const total = tasks.length;

        const completed = tasks.filter(
            (task) => task.status === TASK_STATUS.COMPLETED
        ).length;

        const pending = tasks.filter(
            (task) => task.status === TASK_STATUS.PENDING
        ).length;

        return {
            total,
            pending,
            completed,
        };
    }, [tasks]);

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <WelcomeBanner studentName="Pooja" />

                <section className="stats-grid">
                    <StatCard
                        title="Total Tasks"
                        value={statistics.total}
                        icon="📋"
                        type="total"
                    />

                    <StatCard
                        title="Pending"
                        value={statistics.pending}
                        icon="◷"
                        type="pending"
                    />

                    <StatCard
                        title="Completed"
                        value={statistics.completed}
                        icon="✓"
                        type="completed"
                    />
                </section>

                <TaskForm
                    onAddTask={addTask}
                    onUpdateTask={updateTask}
                    editingTask={editingTask}
                    onCancelEdit={() => setEditingTask(null)}
                />

                <TaskTable
                    tasks={tasks}
                    onEditTask={startEditing}
                    onDeleteTask={deleteTask}
                    onToggleComplete={toggleComplete}
                />
            </main>
        </div>
    );
}

export default Dashboard;