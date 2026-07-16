// lib/dietary-options.ts

// Canonical dietary/allergy slugs. Stored in profiles.dietary_restrictions;
// human-readable labels live in messages/{sv,en}.json under the "Dietary" key.
export const DIETARY_OPTIONS = [
  "gluten",
  "lactose",
  "shellfish",
  "vegetarian",
  "vegan",
  "pescatarian",
] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number];

export function isDietaryOption(value: string): value is DietaryOption {
  return (DIETARY_OPTIONS as readonly string[]).includes(value);
}
