export type MissingnessThreshold = "5%" | "10%" | "20%";
export type EvidenceStrength = "High" | "Medium" | "Low";

export type FoodRecord = {
  id: string;
  rank: number;
  food: string;
  category: string;
  finalScore: number;
  keyNutrients: string[];
  threshold: MissingnessThreshold;
  rdiCheck: "Strong" | "Moderate" | "Limited";
  evidenceStrength: EvidenceStrength;
};

export type NutrientSignal = {
  nutrient: string;
  supportCount: number;
  supportPercent: number;
};

export type DashboardSummary = {
  foodsAnalyzed: number;
  nutrientsRetained: number;
  pubmedAbstractsScreened: number;
  mostSupportedSignal: string;
  highestRankedFood: string;
};

export const dashboardSummary: DashboardSummary = {
  foodsAnalyzed: 834,
  nutrientsRetained: 17,
  pubmedAbstractsScreened: 675,
  mostSupportedSignal: "Iron",
  highestRankedFood: "Carrot, boiled, drained",
};

// These records are derived from data/processed/topsis-results.csv and
// data/processed/rdi-coverage-top-foods-wide.csv from the current pipeline run.
// Category is inferred from WAFCT code groups. Replace this module with parsed
// CSV/JSON exports when the dashboard is connected to the full dataset.
export const foodRecords: FoodRecord[] = [
  { id: "04_007", rank: 1, food: "Carrot, boiled, drained", category: "Vegetables", finalScore: 0.790, keyNutrients: ["iron", "vitamin A", "fiber"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "04_043", rank: 2, food: "Onion, fresh, boiled, drained", category: "Vegetables", finalScore: 0.781, keyNutrients: ["iron", "copper", "fiber"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "04_075", rank: 3, food: "Jute mallow leaves, dried", category: "Vegetables", finalScore: 0.613, keyNutrients: ["iron", "riboflavin", "vitamin B6"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "06_039", rank: 4, food: "Benniseed, dried, raw", category: "Nuts and seeds", finalScore: 0.602, keyNutrients: ["iron", "copper", "magnesium"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "04_031", rank: 5, food: "Cowpea leaves, dried", category: "Vegetables", finalScore: 0.513, keyNutrients: ["copper", "iron", "riboflavin"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "01_001", rank: 6, food: "Fonio, white whole grains, raw", category: "Cereals and grains", finalScore: 0.429, keyNutrients: ["iron", "magnesium", "fiber"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "09_057", rank: 7, food: "Shrimp, whole, dried", category: "Fish and seafood", finalScore: 0.384, keyNutrients: ["vitamin B12", "copper", "calcium"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "04_069", rank: 8, food: "Turnip, boiled, drained", category: "Vegetables", finalScore: 0.308, keyNutrients: ["iron", "vitamin C", "copper"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "07_018", rank: 9, food: "Beef liver, boiled, drained", category: "Meat and poultry", finalScore: 0.281, keyNutrients: ["vitamin B12", "vitamin A", "copper"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "04_055", rank: 10, food: "Pumpkin leaves, dried", category: "Vegetables", finalScore: 0.270, keyNutrients: ["magnesium", "copper", "iron"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "High" },
  { id: "07_089", rank: 11, food: "Beef liver, stewed", category: "Meat and poultry", finalScore: 0.270, keyNutrients: ["vitamin B12", "vitamin A", "copper"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "07_054", rank: 12, food: "Lamb liver, boiled, drained", category: "Meat and poultry", finalScore: 0.264, keyNutrients: ["vitamin B12", "vitamin A", "copper"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "07_132", rank: 13, food: "Lamb liver, stewed", category: "Meat and poultry", finalScore: 0.250, keyNutrients: ["vitamin B12", "copper", "vitamin A"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "04_071", rank: 14, food: "Sicklepod leaves, dried", category: "Vegetables", finalScore: 0.247, keyNutrients: ["iron", "vitamin B6", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "07_088", rank: 15, food: "Beef liver, grilled", category: "Meat and poultry", finalScore: 0.245, keyNutrients: ["vitamin B12", "vitamin A", "copper"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "07_108", rank: 16, food: "Chicken liver, boiled, drained", category: "Meat and poultry", finalScore: 0.238, keyNutrients: ["vitamin A", "vitamin B12", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "01_024", rank: 17, food: "Pearl millet, IKMP 6 variety, raw", category: "Cereals and grains", finalScore: 0.233, keyNutrients: ["iron", "copper", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "01_021", rank: 18, food: "Pearl millet, IKMP 3 variety, raw", category: "Cereals and grains", finalScore: 0.232, keyNutrients: ["iron", "copper", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "01_023", rank: 19, food: "Pearl millet, IKMP 5 variety, raw", category: "Cereals and grains", finalScore: 0.232, keyNutrients: ["iron", "copper", "fiber"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "01_022", rank: 20, food: "Pearl millet, IKMP 4 variety, raw", category: "Cereals and grains", finalScore: 0.232, keyNutrients: ["iron", "copper", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Medium" },
  { id: "01_025", rank: 21, food: "Pearl millet, IKMP 7 variety, raw", category: "Cereals and grains", finalScore: 0.232, keyNutrients: ["iron", "copper", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Low" },
  { id: "01_032", rank: 22, food: "Pearl millet, combined varieties, raw", category: "Cereals and grains", finalScore: 0.232, keyNutrients: ["iron", "copper", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Low" },
  { id: "01_027", rank: 23, food: "Pearl millet, IKMP 9 variety, raw", category: "Cereals and grains", finalScore: 0.232, keyNutrients: ["iron", "copper", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Low" },
  { id: "01_030", rank: 24, food: "Pearl millet, IKMP 12 variety, raw", category: "Cereals and grains", finalScore: 0.232, keyNutrients: ["iron", "copper", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Low" },
  { id: "01_018", rank: 25, food: "Pearl millet, IKMV 8201 variety, raw", category: "Cereals and grains", finalScore: 0.232, keyNutrients: ["iron", "copper", "folate"], threshold: "10%", rdiCheck: "Strong", evidenceStrength: "Low" },
];

// Derived from data/processed/nutrient-weights.csv. supportPercent is the
// normalized literature-derived nutrient weight multiplied by 100.
export const nutrientSignals: NutrientSignal[] = [
  { nutrient: "Iron", supportCount: 123, supportPercent: 50.6 },
  { nutrient: "Protein", supportCount: 32, supportPercent: 13.2 },
  { nutrient: "Vitamin A", supportCount: 23, supportPercent: 9.5 },
  { nutrient: "Zinc", supportCount: 15, supportPercent: 6.2 },
  { nutrient: "Folate", supportCount: 15, supportPercent: 6.2 },
  { nutrient: "Vitamin C", supportCount: 7, supportPercent: 2.9 },
  { nutrient: "Sodium", supportCount: 6, supportPercent: 2.5 },
  { nutrient: "Vitamin B12", supportCount: 5, supportPercent: 2.1 },
  { nutrient: "Calcium", supportCount: 4, supportPercent: 1.6 },
  { nutrient: "Net carbs", supportCount: 3, supportPercent: 1.2 },
];
