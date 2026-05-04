from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
OUTPUT_DIR = ROOT / "outputs"
FIGURE_DIR = OUTPUT_DIR / "figures"

RAW_WAFCT_FILE = RAW_DIR / "wafct_raw.xlsx"
PUBMED_FILE = PROCESSED_DIR / "pubmed-west-africa-deficiency-2015-present.csv"

DEFAULT_MISSINGNESS_THRESHOLD = 0.10

ID_COLUMNS = ["Code", "Food name in English", "Scientific name"]
TOPSIS_ID_COLUMNS = ["Code", "Food name in English"]

TOTAL_CARBS_COLUMN = "Carbohydrate, available; calculated by difference\n(g)"
FIBER_COLUMN = "Fibre, total dietary or [fibre, crude]\n(g)"
NET_CARBS_COLUMN = "net_carbs\n(g)"

# These fields are not model criteria. Some are metadata, some are redundant
# energy/proximate aggregates, and some duplicate nutrient representations.
BASE_DROP_COLUMNS = [
    "Food name in French",
    "BiblioID/Source",
    "Edible portion coefficient 1 (from as purchased to as described)",
    "Edible portion coefficient 2 (from as described to as eaten)",
    "Fatty acid conversion factor",
    "Conversion factor for calculating total protein from total nitrogen",
    "Energy\n(kJ)",
    "Energy\n(kcal)",
    "Sum of proximate components\n(g)",
    "Water\n(g)",
    "Alcohol\n(g)",
    "Ash\n(g)",
    "Fat, total or [fat, derived by analysis using continuous extraction]\n(g)",
    TOTAL_CARBS_COLUMN,
    "Vitamin A (expressed in retinol equivalents)\n(mcg)",
    "Retinol\n(mcg)",
    "Beta-carotene equivalents or [beta-carotene]\n(mcg)",
    "Alpha-carotene\n(mcg)",
    "Beta-carotene\n(mcg)",
    "Beta-cryptoxanthin\n(mcg)",
    "Vitamin E (expressed in alpha-tocopherol equivalents) or [alpha-tocopherol]\n(mg)",
    "Alpha-tocopherol\n(mg)",
    "Beta-tocopherol\n(mg)",
    "Gamma-tocopherol\n(mg)",
    "Delta-tocopherol\n(mg)",
    "Niacin equivalents or [niacin, preformed] (vitamin B3)\n(mg)",
    "Tryptophan\n(mg)",
    "Folic acid (synthetic)\n(mcg)",
    "Folate, naturally occurring (food folate)\n(mcg)",
    "Folate, dietary folate equivalents\n(mcg)",
    "Cholesterol\n(mg)",
    "Phytate, total or [phytate, determined by direct precipitation] or [phytate, determined by indirect precipitation]\n(mg)",
    "Inositol triphosphate (IP3)\n(mg)",
    "Inositol tetraphosphate (IP4)\n(mg)",
    "Inositol pentaphosphate (IP5)\n(mg)",
    "Inositol hexaphosphate (IP6)\n(mg)",
]

NUTRIENTS = [
    {"key": "protein", "column": "Protein, total\n(g)", "direction": "benefit", "terms": ["protein"]},
    {"key": "net_carbs", "column": NET_CARBS_COLUMN, "direction": "cost", "terms": ["net carbohydrate", "net carbohydrates", "carbohydrate", "carbohydrates"]},
    {"key": "fiber", "column": FIBER_COLUMN, "direction": "benefit", "terms": ["fiber", "fibre", "dietary fiber", "dietary fibre"]},
    {"key": "calcium", "column": "Calcium\n(mg)", "direction": "benefit", "terms": ["calcium"]},
    {"key": "iron", "column": "Iron\n(mg)", "direction": "benefit", "terms": ["iron"]},
    {"key": "magnesium", "column": "Magnesium\n(mg)", "direction": "benefit", "terms": ["magnesium"]},
    {"key": "phosphorus", "column": "Phosphorus\n(mg)", "direction": "benefit", "terms": ["phosphorus", "phosphate"]},
    {"key": "potassium", "column": "Potassium\n(mg)", "direction": "benefit", "terms": ["potassium"]},
    {"key": "sodium", "column": "Sodium\n(mg)", "direction": "cost", "terms": ["sodium", "salt"]},
    {"key": "zinc", "column": "Zinc\n(mg)", "direction": "benefit", "terms": ["zinc"]},
    {"key": "copper", "column": "Copper\n(mg)", "direction": "benefit", "terms": ["copper"]},
    {"key": "vitamin_a", "column": "Vitamin A (expressed in retinol activity equivalents)\n(mcg)", "direction": "benefit", "terms": ["vitamin a", "retinol", "retinol activity equivalent", "retinol activity equivalents", "rae"]},
    {"key": "vitamin_c", "column": "Vitamin C\n(mg)", "direction": "benefit", "terms": ["vitamin c", "ascorbic acid"]},
    {"key": "vitamin_d", "column": "Vitamin D \n(mcg)", "direction": "benefit", "terms": ["vitamin d", "cholecalciferol"]},
    {"key": "vitamin_b12", "column": "Vitamin B12\n(mcg)", "direction": "benefit", "terms": ["vitamin b12", "b12", "cobalamin"]},
    {"key": "vitamin_b6", "column": "Vitamin B6\n(mg)", "direction": "benefit", "terms": ["vitamin b6", "b6", "pyridoxine"]},
    {"key": "thiamine", "column": "Thiamine (vitamin B1)\n(mg)", "direction": "benefit", "terms": ["thiamine", "vitamin b1", "b1"]},
    {"key": "riboflavin", "column": "Riboflavin (vitamin B2)\n(mg)", "direction": "benefit", "terms": ["riboflavin", "vitamin b2", "b2"]},
    {"key": "niacin", "column": "Niacin, preformed\n(mg)", "direction": "benefit", "terms": ["niacin", "vitamin b3", "b3"]},
    {"key": "folate", "column": "Folate, total or [folate, sum of vitamers] (vitamin B9)\n(mcg)", "direction": "benefit", "terms": ["folate", "folic acid", "vitamin b9", "b9"]},
    {"key": "saturated_fat", "column": "Fatty acids, total saturated\n(g)", "direction": "cost", "terms": ["saturated fat", "saturated fatty acid", "saturated fatty acids"]},
    {"key": "monounsaturated_fat", "column": "Fatty acids, total monounsaturated \n(g)", "direction": "benefit", "terms": ["monounsaturated fat", "monounsaturated fatty acid", "monounsaturated fatty acids", "mufa"]},
    {"key": "polyunsaturated_fat", "column": "Fatty acids, total polyunsaturated\n(g)", "direction": "benefit", "terms": ["polyunsaturated fat", "polyunsaturated fatty acid", "polyunsaturated fatty acids", "pufa"]},
    {"key": "linoleic_acid", "column": "Linoleic acid \n(g)", "direction": "benefit", "terms": ["linoleic acid"]},
    {"key": "alpha_linolenic_acid", "column": "Alpha-linolenic acid\n(g)", "direction": "benefit", "terms": ["alpha-linolenic acid", "alpha linolenic acid", "ala"]},
]

# Deficiency terms are intentionally targeted. We avoid generating blanket
# "<nutrient> deficiency" phrases for every nutrient because that can inflate
# support with noisy generic co-occurrences rather than high-signal context.
DEFICIENCY_TERMS_BY_NUTRIENT = {
    "iron": ["anemia", "anaemia", "iron deficiency", "iron-deficiency anemia", "iron-deficiency anaemia"],
    "vitamin_a": ["vitamin a deficiency", "night blindness", "xerophthalmia"],
    "zinc": ["zinc deficiency"],
    "folate": ["folate deficiency", "folic acid deficiency", "neural tube defect", "megaloblastic anemia"],
    "vitamin_b12": ["vitamin b12 deficiency", "cobalamin deficiency", "megaloblastic anemia"],
    "vitamin_d": ["vitamin d deficiency", "rickets"],
    "calcium": ["calcium deficiency", "rickets"],
    "protein": ["protein deficiency", "protein energy malnutrition", "protein-energy malnutrition", "kwashiorkor"],
    "fiber": ["low fiber intake", "low fibre intake", "inadequate fiber intake", "inadequate fibre intake"],
    "net_carbs": ["excess carbohydrate intake", "high carbohydrate intake", "refined carbohydrate"],
}

GENERAL_DEFICIENCY_CONTEXT_TERMS = [
    "deficiency",
    "deficiencies",
    "deficient",
    "inadequate intake",
    "low intake",
    "low status",
    "poor intake",
    "poor status",
    "undernutrition",
    "malnutrition",
    "stunting",
    "wasting",
    "micronutrient deficiency",
    "suboptimal intake",
    "below requirement",
    "not meeting requirements",
]

OUTPUT_FILES = {
    "base": PROCESSED_DIR / "wafct-clean-base.csv",
    "eligibility_rules": PROCESSED_DIR / "food-eligibility-rules.csv",
    "eligibility_overrides": PROCESSED_DIR / "food-eligibility-overrides.csv",
    "eligibility_screened": PROCESSED_DIR / "food-eligibility-screened.csv",
    "eligibility_excluded_log": PROCESSED_DIR / "food-eligibility-excluded-log.csv",
    "manual_review": OUTPUT_DIR / "manual-review-required-foods.csv",
    "filtered": PROCESSED_DIR / "wafct-nutrients-filtered.csv",
    "complete_case_log": PROCESSED_DIR / "complete-case-food-removal-log.csv",
    "missingness": PROCESSED_DIR / "missingness-summary.csv",
    "nutrient_dictionary": PROCESSED_DIR / "nutrient-dictionary.csv",
    "deficiency_dictionary": PROCESSED_DIR / "deficiency-dictionary.csv",
    "support_counts": PROCESSED_DIR / "nutrient-abstract-support-counts.csv",
    "weights": PROCESSED_DIR / "nutrient-weights.csv",
    "directions": PROCESSED_DIR / "nutrient-directions.csv",
    "raw_matrix": PROCESSED_DIR / "decision-matrix-raw.csv",
    "normalized_matrix": PROCESSED_DIR / "decision-matrix-normalized.csv",
    "weighted_matrix": PROCESSED_DIR / "decision-matrix-weighted.csv",
    "topsis": PROCESSED_DIR / "topsis-results.csv",
    "ideal_worst": PROCESSED_DIR / "topsis-ideal-worst-solutions.csv",
    "abstract_flags": PROCESSED_DIR / "abstract-nutrient-flags.csv",
    "rdi_long": PROCESSED_DIR / "rdi-coverage-top-foods-long.csv",
    "rdi_wide": PROCESSED_DIR / "rdi-coverage-top-foods-wide.csv",
}

# Eligibility screening is applied before missingness filtering and TOPSIS.
# WAFCT is a food composition reference and includes ingredients, condiments,
# additives, and recipe-calculation items; this project ranks only plausible
# standalone foods or normal dishes for prioritization.
ELIGIBILITY_RULES = [
    {
        "rule_id": "E001",
        "match_column": "food_name",
        "pattern": r"^potash,\s*solid$",
        "eligibility_status": "exclude",
        "reason": "Culinary additive/caustic compound; not a standalone food recommendation.",
        "source": "MedlinePlus potassium carbonate/hydroxide; WAFCT food name",
    },
    {
        "rule_id": "E002",
        "match_column": "food_name",
        "pattern": r"^baking soda\b|sodium bicarbonate",
        "eligibility_status": "exclude",
        "reason": "Leavening/processing agent, not a standalone food recommendation.",
        "source": "Project food-candidate eligibility rule; WAFCT food name",
    },
    {
        "rule_id": "E003",
        "match_column": "food_name",
        "pattern": r"^salt$",
        "eligibility_status": "exclude",
        "reason": "Seasoning used in small amounts, not a standalone food recommendation.",
        "source": "Project food-candidate eligibility rule; WAFCT food name",
    },
    {
        "rule_id": "E004",
        "match_column": "food_name",
        "pattern": r"\bcube\b|bouillon|stock cube",
        "eligibility_status": "exclude",
        "reason": "Seasoning cube/condiment used in small amounts.",
        "source": "Project food-candidate eligibility rule; WAFCT food name",
    },
    {
        "rule_id": "E005",
        "match_column": "food_name",
        "pattern": r"^vinegar$",
        "eligibility_status": "exclude",
        "reason": "Condiment used in small amounts, not a standalone food recommendation.",
        "source": "Project food-candidate eligibility rule; WAFCT food name",
    },
    {
        "rule_id": "R001",
        "match_column": "food_name",
        "pattern": r"^yeast, dried$|yeast extract",
        "eligibility_status": "manual_review",
        "reason": "Ambiguous nutrient-dense ingredient/condiment; review before allowing into TOPSIS.",
        "source": "Project food-candidate eligibility rule; WAFCT food name",
    },
    {
        "rule_id": "E006",
        "match_column": "Code",
        "pattern": r"^13_",
        "eligibility_status": "exclude",
        "reason": "Condiments, spices, additives, sweeteners, or minor-use ingredients; per-100g ranking would overstate relevance.",
        "source": "Project food-candidate eligibility rule; WAFCT code group 13 and food names",
    },
    {
        "rule_id": "E007",
        "match_column": "food_name",
        "pattern": r"^ovaltine\b",
        "eligibility_status": "exclude",
        "reason": "Beverage powder/product outside core food-prioritization candidate set.",
        "source": "Project food-candidate eligibility rule; WAFCT food name",
    },
]

RDI = {
    "Protein, total\n(g)": 50,
    FIBER_COLUMN: 28,
    "Calcium\n(mg)": 1300,
    "Iron\n(mg)": 18,
    "Magnesium\n(mg)": 420,
    "Phosphorus\n(mg)": 1250,
    "Potassium\n(mg)": 4700,
    "Zinc\n(mg)": 11,
    "Copper\n(mg)": 0.9,
    "Vitamin A (expressed in retinol activity equivalents)\n(mcg)": 900,
    "Vitamin C\n(mg)": 90,
    "Vitamin D \n(mcg)": 20,
    "Vitamin B12\n(mcg)": 2.4,
    "Vitamin B6\n(mg)": 1.7,
    "Thiamine (vitamin B1)\n(mg)": 1.2,
    "Riboflavin (vitamin B2)\n(mg)": 1.3,
    "Niacin, preformed\n(mg)": 16,
    "Folate, total or [folate, sum of vitamers] (vitamin B9)\n(mcg)": 400,
}
