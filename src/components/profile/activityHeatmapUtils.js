export function buildActivityWeeks(numWeeks = 52, referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  const firstWeekStart = new Date(currentWeekStart);
  firstWeekStart.setDate(currentWeekStart.getDate() - ((numWeeks - 1) * 7));

  return Array.from({ length: numWeeks }, (_, weekIndex) => (
    Array.from({ length: 7 }, (_, dayIndex) => {
      const day = new Date(firstWeekStart);
      day.setDate(firstWeekStart.getDate() + (weekIndex * 7) + dayIndex);
      return day <= today ? day : null;
    })
  ));
}
