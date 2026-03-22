export const SPORT_CATEGORIES = [
  { key: "football", label: "Football", icon: "circle-dot" },
  { key: "basketball", label: "Basketball", icon: "dribbble" },
  { key: "dance", label: "Dance", icon: "music" },
  { key: "swimming", label: "Swimming", icon: "waves" },
  { key: "tennis", label: "Tennis", icon: "target" },
  { key: "martial_arts", label: "Martial Arts", icon: "swords" },
  { key: "gymnastics", label: "Gymnastics", icon: "flip-horizontal" },
  { key: "music", label: "Music", icon: "music-2" },
  { key: "art", label: "Art", icon: "palette" },
  { key: "volleyball", label: "Volleyball", icon: "circle" },
  { key: "hockey", label: "Hockey", icon: "hexagon" },
  { key: "athletics", label: "Athletics", icon: "timer" },
  { key: "yoga", label: "Yoga", icon: "heart-pulse" },
  { key: "other", label: "Other", icon: "trophy" },
] as const;

export type SportCategory = (typeof SPORT_CATEGORIES)[number]["key"];

export const GROUP_COLORS = [
  "#0A5DA3", // primary blue
  "#2EAE6D", // secondary green
  "#E8942E", // accent orange
  "#3D8FD4", // light blue
  "#D64545", // danger red
  "#1F8A52", // dark green
  "#C47A1F", // dark orange
  "#074A82", // dark blue
  "#5FD69A", // light green
  "#F5B66A", // light orange
] as const;

export const INVITE_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_CODE_CHARS.charAt(
      Math.floor(Math.random() * INVITE_CODE_CHARS.length)
    );
  }
  return code;
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const SKILL_LEVELS = [
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
  { key: "all", label: "All Levels" },
] as const;
