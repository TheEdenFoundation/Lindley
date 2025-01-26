/** Get the start and end of the week in ISO format */
export function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    startISO: startOfWeek.toISOString().split("T")[0],
    endISO: endOfWeek.toISOString().split("T")[0],
  };
}

/** Get tomorrow's date in ISO format */
export function getTomorrowISO() {
  return new Date(new Date().setDate(new Date().getDate() + 1))
    .toISOString()
    .split("T")[0];
}
