import {
  addDays,
  addWeeks,
  format,
  getDay,
  isBefore,
  isAfter,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import type { RecurringSchedule, Session } from "../types/database.types";

/**
 * Generate session instances from recurring schedule rules for a given date range.
 *
 * Logic:
 * - For each recurring rule, iterate through every occurrence within [rangeStart, rangeEnd].
 * - Each occurrence becomes a Session row (to be inserted into DB).
 *
 * @param rules     - Recurring schedule rules for a group
 * @param groupId   - The group these sessions belong to
 * @param rangeStart - Start of generation window
 * @param rangeEnd   - End of generation window
 * @returns Array of session objects ready for DB insert
 */
export function generateSessionsFromRules(
  rules: RecurringSchedule[],
  groupId: string,
  rangeStart: Date,
  rangeEnd: Date
): Omit<Session, "id" | "created_at">[] {
  const sessions: Omit<Session, "id" | "created_at">[] = [];

  for (const rule of rules) {
    const validFrom = parseISO(rule.valid_from);
    const validUntil = rule.valid_until ? parseISO(rule.valid_until) : rangeEnd;

    // Effective range = intersection of [validFrom, validUntil] and [rangeStart, rangeEnd]
    const effectiveStart = isBefore(rangeStart, validFrom) ? validFrom : rangeStart;
    const effectiveEnd = isAfter(rangeEnd, validUntil) ? validUntil : rangeEnd;

    if (isAfter(effectiveStart, effectiveEnd)) continue;

    // Find the first occurrence of the target day of week within effective range
    let current = startOfDay(effectiveStart);
    const targetDay = rule.day_of_week; // 0=Sunday, 6=Saturday

    // Advance to the first matching day
    while (getDay(current) !== targetDay) {
      current = addDays(current, 1);
    }

    // Parse time components
    const [startHour, startMin] = rule.start_time.split(":").map(Number);
    const [endHour, endMin] = rule.end_time.split(":").map(Number);

    // Generate weekly occurrences
    while (isBefore(current, effectiveEnd) || format(current, "yyyy-MM-dd") === format(effectiveEnd, "yyyy-MM-dd")) {
      const startsAt = setMinutes(setHours(current, startHour), startMin);
      const endsAt = setMinutes(setHours(current, endHour), endMin);

      sessions.push({
        group_id: groupId,
        location_id: rule.location_id,
        title: null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        is_cancelled: false,
        cancellation_reason: null,
        notes: null,
      });

      current = addWeeks(current, 1);
    }
  }

  // Sort by start time
  sessions.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );

  return sessions;
}

/**
 * Get sessions for a specific date from a list of sessions.
 */
export function getSessionsForDate(
  sessions: Session[],
  date: Date
): Session[] {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return sessions.filter((s) => {
    const sessionDate = parseISO(s.starts_at);
    return (
      (isAfter(sessionDate, dayStart) || format(sessionDate, "yyyy-MM-dd") === format(dayStart, "yyyy-MM-dd")) &&
      isBefore(sessionDate, dayEnd)
    );
  });
}

/**
 * Get sessions for the current week.
 */
export function getSessionsForWeek(
  sessions: Session[],
  date: Date
): Session[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  return sessions.filter((s) => {
    const sessionDate = parseISO(s.starts_at);
    return (
      (isAfter(sessionDate, weekStart) || format(sessionDate, "yyyy-MM-dd") === format(weekStart, "yyyy-MM-dd")) &&
      isBefore(sessionDate, weekEnd)
    );
  });
}

/**
 * Check if a session overlaps with existing sessions.
 */
export function hasOverlap(
  newStart: Date,
  newEnd: Date,
  existingSessions: Session[]
): boolean {
  return existingSessions.some((s) => {
    const sStart = parseISO(s.starts_at);
    const sEnd = parseISO(s.ends_at);
    return isBefore(newStart, sEnd) && isAfter(newEnd, sStart);
  });
}
