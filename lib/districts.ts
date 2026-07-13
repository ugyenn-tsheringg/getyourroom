// Mock reference data for v1 — see DATA_MODEL.md. Replace with real data later.
export const DISTRICTS_AND_PLACES: Record<string, string[]> = {
  "Thimphu": ["Motithang", "Changzamtog", "Babesa", "Olakha", "Chang Gidaphu"],
  "Paro": ["Paro Town", "Bondey", "Woochu"],
  "Punakha": ["Khuruthang", "Punakha Town"],
  "Wangdue Phodrang": ["Bajo Town", "Wangdue Town"],
  "Chukha (Phuentsholing)": ["Phuentsholing Town", "Pasakha"],
  "Samtse": ["Samtse Town", "Gomtu"],
  "Trongsa": ["Trongsa Town"],
  "Bumthang": ["Jakar", "Chamkhar"],
  "Mongar": ["Mongar Town"],
  "Trashigang": ["Trashigang Town", "Rangjung"],
};

export const DISTRICTS = Object.keys(DISTRICTS_AND_PLACES);

export const ROOM_TYPES = [
  { value: "studio", label: "Studio" },
  { value: "1bhk", label: "1 BHK" },
  { value: "2bhk", label: "2 BHK" },
] as const;

export function roomTypeLabel(value: string): string {
  return ROOM_TYPES.find((t) => t.value === value)?.label ?? value;
}
