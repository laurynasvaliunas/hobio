/**
 * Sport categories with emoji mappings.
 * This provides a fun, visual way to represent different sports/activities.
 */

const SPORT_EMOJI_MAP: Record<string, string> = {
  football: "⚽",
  basketball: "🏀",
  dance: "💃",
  swimming: "🏊",
  tennis: "🎾",
  martial_arts: "🥋",
  gymnastics: "🤸",
  music: "🎵",
  art: "🎨",
  volleyball: "🏐",
  hockey: "🏒",
  athletics: "🏃",
  yoga: "🧘",
  other: "🏆",
};

/**
 * Get emoji for a given sport category.
 * 
 * @param sportKey - The sport category key (e.g., 'football', 'basketball')
 * @returns The emoji string for the sport, or a default trophy emoji if not found
 * 
 * @example
 * getSportEmoji('football') // returns '⚽'
 * getSportEmoji('dance') // returns '💃'
 * getSportEmoji('unknown') // returns '🏆'
 */
export const getSportEmoji = (sportKey: string): string => {
  return SPORT_EMOJI_MAP[sportKey] ?? "🏆";
};

/**
 * Get all sport categories with their emojis.
 * Useful for displaying options in a picker or list.
 * 
 * @returns Array of sport category objects with key, label, and emoji
 */
export const getSportCategoriesWithEmojis = () => {
  return [
    { key: "football", label: "Football", emoji: "⚽" },
    { key: "basketball", label: "Basketball", emoji: "🏀" },
    { key: "dance", label: "Dance", emoji: "💃" },
    { key: "swimming", label: "Swimming", emoji: "🏊" },
    { key: "tennis", label: "Tennis", emoji: "🎾" },
    { key: "martial_arts", label: "Martial Arts", emoji: "🥋" },
    { key: "gymnastics", label: "Gymnastics", emoji: "🤸" },
    { key: "music", label: "Music", emoji: "🎵" },
    { key: "art", label: "Art", emoji: "🎨" },
    { key: "volleyball", label: "Volleyball", emoji: "🏐" },
    { key: "hockey", label: "Hockey", emoji: "🏒" },
    { key: "athletics", label: "Athletics", emoji: "🏃" },
    { key: "yoga", label: "Yoga", emoji: "🧘" },
    { key: "other", label: "Other", emoji: "🏆" },
  ] as const;
};
