import { format, isToday, isTomorrow, parseISO } from "date-fns";

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

/**
 * Format a time string (HH:mm:ss or ISO) for display
 */
export function formatTime(timeString: string): string {
  if (timeString.includes("T")) {
    return format(parseISO(timeString), "HH:mm");
  }
  // Plain time string like "17:00:00"
  return timeString.slice(0, 5);
}

/**
 * Format a session time range
 */
export function formatSessionTime(startsAt: string, endsAt: string): string {
  return `${formatTime(startsAt)} - ${formatTime(endsAt)}`;
}

/**
 * Get initials from a full name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR"
): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
