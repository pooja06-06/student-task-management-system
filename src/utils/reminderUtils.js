export const getTaskReminder = (task) => {
  if (task.status === "Completed" || !task.dueDate) {
    return null;
  }

  const [year, month, day] = task.dueDate.split("-").map(Number);

  const dueDate = new Date(year, month - 1, day);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const daysLeft = Math.round(
    (dueDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft < 0) {
    return {
      type: "overdue",
      message: `Overdue by ${Math.abs(daysLeft)} day(s)`,
    };
  }

  if (daysLeft === 0) {
    return {
      type: "today",
      message: "Due today",
    };
  }

  if (daysLeft === 1) {
    return {
      type: "tomorrow",
      message: "Due tomorrow",
    };
  }

  if (daysLeft <= 3) {
    return {
      type: "upcoming",
      message: `Due in ${daysLeft} days`,
    };
  }

  return null;
};