import type { Restaurant } from "./types";

function titleCaseWord(word: string): string {
  if (!word) return word;

  const lower = word.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    if (/[a-z]/.test(lower[i])) {
      return lower.slice(0, i) + lower[i].toUpperCase() + lower.slice(i + 1);
    }
  }
  return lower;
}

export function formatRestaurantName(input: string): string {
  const collapsed = input.trim().replace(/\s+/g, " ");
  if (!collapsed) return "";

  return collapsed
    .split(" ")
    .map((word) => titleCaseWord(word))
    .join(" ");
}

export function normalizeRestaurantName(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function matchesSearch(query: string, restaurant: Restaurant): boolean {
  const normalizedQuery = normalizeRestaurantName(query);
  if (!normalizedQuery) return true;

  return (
    restaurant.normalized_name.startsWith(normalizedQuery) ||
    restaurant.normalized_name.includes(normalizedQuery)
  );
}
