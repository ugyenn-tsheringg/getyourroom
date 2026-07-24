import {
  HeaterIcon,
  FilterIcon,
  Wifi01Icon,
  WashingMachineIcon,
  TerraceIcon,
  SnowIcon,
  SwimmingIcon,
  SecurityIcon,
  CarParking01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

// The icon objects are the data shape HugeiconsIcon accepts for its `icon` prop.
type IconData = typeof Tick02Icon;

export type Feature = { label: string; icon: IconData };

// Predefined utilities — each has its own relevant icon.
export const UTILITIES: readonly Feature[] = [
  { label: "Geyser / Water Heater", icon: HeaterIcon },
  { label: "Water Filter / Purifier", icon: FilterIcon },
  { label: "Free Wi-Fi", icon: Wifi01Icon },
];

// Predefined amenities — each has its own relevant icon.
export const AMENITIES: readonly Feature[] = [
  { label: "Free Washing Machine", icon: WashingMachineIcon },
  { label: "Balcony / Terrace", icon: TerraceIcon },
  { label: "Air Conditioner", icon: SnowIcon },
  { label: "Swimming Pool", icon: SwimmingIcon },
  { label: "24 Hours Security", icon: SecurityIcon },
  { label: "Free Parking", icon: CarParking01Icon },
];

// Custom items the vendor typed in fall back to a generic tick.
export const FALLBACK_ICON: IconData = Tick02Icon;

const ICON_BY_LABEL = new Map<string, IconData>(
  [...UTILITIES, ...AMENITIES].map((f) => [f.label, f.icon])
);

// Predefined items get their specific icon; anything custom gets a tick.
export function featureIcon(label: string): IconData {
  return ICON_BY_LABEL.get(label) ?? FALLBACK_ICON;
}

// Selected features are stored as a comma-separated string (same convention as
// the existing `amenities` column). Custom entries have commas stripped so they
// can't break the encoding.
export function parseFeatures(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeFeatures(items: string[]): string | null {
  return items.length > 0 ? items.join(", ") : null;
}

export const FURNISHING_OPTIONS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "fully_furnished", label: "Fully Furnished" },
] as const;

export function furnishingLabel(value: string | null | undefined): string | null {
  return FURNISHING_OPTIONS.find((o) => o.value === value)?.label ?? null;
}
