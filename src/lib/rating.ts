export const MIN_RATING = 1;
export const MAX_RATING = 5;

export function isValidRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_RATING &&
    value <= MAX_RATING
  );
}

export function parseRating(raw: FormDataEntryValue | string | null): number | null {
  if (raw == null) {
    return null;
  }

  const value = String(raw).trim();
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return isValidRating(parsed) ? parsed : null;
}

/** Average rating across visits for a restaurant, or null if none. */
export function averageRatingForRestaurant(
  visits: ReadonlyArray<{ restaurant_id: string; rating: number }>,
  restaurantId: string,
): number | null {
  let sum = 0;
  let count = 0;

  for (const visit of visits) {
    if (visit.restaurant_id !== restaurantId) {
      continue;
    }
    sum += visit.rating;
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return sum / count;
}

/** Round to nearest half-star for display (e.g. 4.2 → 4, 4.3 → 4.5). */
export function roundToHalfStar(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Unicode star string for map popups / plain text (integer ratings). */
export function formatStarGlyphs(rating: number): string {
  const filled = Math.max(0, Math.min(MAX_RATING, Math.round(rating)));
  return `${"★".repeat(filled)}${"☆".repeat(MAX_RATING - filled)}`;
}

export function formatAverageRating(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
