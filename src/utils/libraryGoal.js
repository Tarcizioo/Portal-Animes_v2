export const DEFAULT_WEEKLY_GOAL = 12;

export function normalizeWeeklyGoal(goal) {
  return Math.min(100, Math.max(1, Number(goal) || DEFAULT_WEEKLY_GOAL));
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getCurrentWeekKeys(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  const monday = new Date(today);
  const day = today.getDay();
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  const keys = [];
  const cursor = new Date(monday);
  while (cursor <= today) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function calculateWeeklyGoal(activityLog = {}, goal, referenceDate = new Date()) {
  const normalizedGoal = normalizeWeeklyGoal(goal);
  const watched = getCurrentWeekKeys(referenceDate)
    .reduce((total, key) => total + (Number(activityLog[key]) || 0), 0);

  return {
    goal: normalizedGoal,
    watched,
    progress: Math.min(100, Math.round((watched / normalizedGoal) * 100)),
    remaining: Math.max(0, normalizedGoal - watched),
  };
}
