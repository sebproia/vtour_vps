export function tourDay(date?: string): string {
  return date || new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function validateDate(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error("Invalid date");
}

export function validateWeek(week?: string[]) {
  if (week && week.length !== 0 && week.length !== 7) throw new Error("Expected seven opening days");
}

/** Google weekday_text is Monday first, regardless of the labels' language. */
export function openingHoursForDate(week: string[] | undefined, date: string) {
  validateDate(date);
  validateWeek(week);
  if (!week?.length) return undefined;
  const index = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  return week[index].replace(/^[^:]+:\s*/, "");
}
