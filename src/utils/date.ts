// Shared date helpers used by both (tabs)/planner.tsx and (tabs)/index.tsx,
// so both screens agree on exactly the same date-key format and date math —
// see the DevDiary for why a hand-built "YYYY-MM-DD" key (not toISOString()
// or a raw Date) is necessary: it avoids UTC-shift bugs and gives every part
// of the app one canonical, comparable identifier for "this calendar day."
export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0"); //add 1 to month because js indexes months from 0
  const day = `${date.getDate()}`.padStart(2, "0"); //padStart to ensure day is always 2 digits
  return `${year}-${month}-${day}`;
};

export const getStartOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);//set time to midnight to get the start of the day
  return today;
};

// Same "midnight" logic as getStartOfToday, but for any date — used wherever
// a whole calendar day's range is needed, not just today's (e.g. History's
// per-day HealthKit queries).
export const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

// For human-facing display (contrast with toDateKey, which is for the code
// to compare dates reliably, not for people to read).
export const formatDate = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
