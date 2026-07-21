// Real reference data: all 20 Bhutanese districts (Dzongkhags) and their
// popular rental areas. Source: bhutan-districts.md in the project root.
export const DISTRICTS_AND_PLACES: Record<string, string[]> = {
  "Thimphu": [
    "Thimphu City", "Babesa", "Olakha", "Changzamtog", "Motithang", "Changangkha",
    "Simtokha", "Taba", "Dechencholing", "Jungshina", "Kawajangsa", "Hejo", "Chubachu",
    "Langchupakha", "Norzin Lam", "Chang Lam", "Hongtsho", "Dodena",
  ],
  "Paro": [
    "Paro Town", "Bondey", "Shaba", "Chuzom", "Drukgyel", "Wangchang", "Betikha",
    "Gyepjag", "Tshongdue", "Dopshari", "Lamgong",
  ],
  "Haa": ["Haa Town", "Katsho", "Bji", "Uesu", "Damthang", "Sombaykha", "Yangthang"],
  "Chukha": [
    "Phuentsholing", "Chukha (Tsimasham)", "Gedu", "Pasakha", "Chapcha", "Bunakha",
    "Chhukha Colony", "Tala", "Dala", "Bjachho", "Logchina", "Rinchending", "Damdum",
  ],
  "Samtse": [
    "Samtse", "Gomtu", "Sipsu", "Dorokha", "Chengmari", "Pagli", "Tendu", "Tading",
    "Bara", "Norbugang", "Yoeseltse", "Namgaychholing",
  ],
  "Punakha": [
    "Punakha", "Khuruthang", "Lobesa", "Sopsokha", "Yowakha", "Talo", "Kabjisa",
    "Lunakha", "Toebesa", "Dzomi", "Bjibjokha",
  ],
  "Wangdue Phodrang": [
    "Wangdue Phodrang (Bajo)", "Nobding", "Gangtey (Phobjikha)", "Rurichu",
    "Tikke Zampa", "Sephu", "Thedtsho", "Gasetsho", "Athang",
  ],
  "Gasa": ["Gasa Town", "Laya", "Lunana", "Khatoed", "Khamaed"],
  "Trongsa": [
    "Trongsa", "Tangsibji", "Nabji", "Korphu", "Nubi", "Kuenga Rabten", "Chendebji",
    "Yotongla",
  ],
  "Bumthang": [
    "Jakar (Chamkhar)", "Chhume (Chumey)", "Prakhar", "Ura", "Tang", "Dhur", "Domkhar",
    "Ngang", "Tamshing",
  ],
  "Zhemgang": [
    "Zhemgang Town", "Panbang", "Gomphu", "Tingtibi", "Buli", "Trong", "Bardo", "Shingkhar",
  ],
  "Sarpang": [
    "Gelephu", "Sarpang Town", "Sershong", "Umling", "Jigmecholing", "Chuzagang",
    "Dekiling", "Samtenling", "Pelrithang",
  ],
  "Tsirang": [
    "Damphu", "Sunkosh", "Mendrelgang", "Barshong", "Patshaling", "Kilkhorthang",
    "Rangthangling",
  ],
  "Dagana": [
    "Daga (Dagana Town)", "Dagapela", "Lhamoidzingkha", "Drujegang", "Tashiding", "Kana",
    "Nichula",
  ],
  "Mongar": [
    "Mongar", "Gyalpozhing", "Lingmethang", "Drametse", "Yakgang", "Wengkhar", "Kilikhar",
    "Chali", "Saling", "Narang",
  ],
  "Lhuentse": [
    "Lhuentse Town (Autsho Corridor)", "Autsho", "Tangmachu", "Khoma", "Gangzur",
    "Kurtoe (Dungkar)", "Minjey", "Menbi",
  ],
  "Trashigang": [
    "Trashigang Town", "Kanglung", "Rangjung", "Radhi", "Phongmey", "Khaling", "Wamrong",
    "Merak", "Sakteng", "Bartsham", "Samkhar", "Lumang",
  ],
  "Trashiyangtse": [
    "Trashiyangtse Town", "Duksum", "Gomphu Kora", "Bumdeling", "Khamdang", "Yalang",
    "Ramjar",
  ],
  "Pemagatshel": [
    "Pemagatshel (Denchi)", "Nganglam", "Khar", "Yurung", "Shumar", "Chokhorling",
  ],
  "Samdrup Jongkhar": [
    "Samdrup Jongkhar Town", "Deothang (Dewathang)", "Nganglam", "Jomotshangkha (Daifam)",
    "Orong", "Gomdar", "Martshala", "Samrang", "Langchenphu",
  ],
};

export const DISTRICTS = Object.keys(DISTRICTS_AND_PLACES);

export const ROOM_TYPES = [
  { value: "studio", label: "Studio/1 RK" },
  { value: "1bhk", label: "1 BHK" },
  { value: "2bhk", label: "2 BHK" },
  { value: "3bhk", label: "3 BHK" },
  { value: "4bhk", label: "4+ BHK" },
  { value: "shared", label: "Shared Room" },
  { value: "house", label: "Independent House" },
  { value: "shophouse", label: "Shophouse" },
  { value: "commercial", label: "Commercial Space" },
] as const;

export function roomTypeLabel(value: string): string {
  return ROOM_TYPES.find((t) => t.value === value)?.label ?? value;
}
