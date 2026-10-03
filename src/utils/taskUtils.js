export const formatDate = (dateString) => {
  if (!dateString) return "-";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const isTaskOverdue = (task) => {
  if (task.status === "Completed" || !task.dueDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = task.dueDate.split("-").map(Number);
  const dueDate = new Date(year, month - 1, day);

  return dueDate < today;
};