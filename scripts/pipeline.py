import argparse
import os
import re
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "Agg")
os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parents[1] / "outputs" / ".matplotlib"))

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from config import (
    BASE_DROP_COLUMNS,
    DEFAULT_MISSINGNESS_THRESHOLD,
    DEFICIENCY_TERMS_BY_NUTRIENT,
    ELIGIBILITY_RULES,
    FIGURE_DIR,
    FIBER_COLUMN,
    GENERAL_DEFICIENCY_CONTEXT_TERMS,
    ID_COLUMNS,
    NET_CARBS_COLUMN,
    NUTRIENTS,
    OUTPUT_DIR,
    OUTPUT_FILES,
    PROCESSED_DIR,
    PUBMED_FILE,
    RAW_WAFCT_FILE,
    RDI,
    TOPSIS_ID_COLUMNS,
    TOTAL_CARBS_COLUMN,
)

PALETTE = {
    "blue": "#2E86AB",
    "green": "#6A994E",
    "orange": "#F18F01",
    "purple": "#A23B72",
    "red": "#C73E1D",
    "gray": "#4A4A4A",
}


def parse_threshold(value):
    threshold = float(value)
    return threshold / 100 if threshold > 1 else threshold


def nutrient_lookup():
    return {item["key"]: item for item in NUTRIENTS}


def as_number(series):
    """Convert WAFCT values to numeric while preserving bracketed estimates."""
    cleaned = series.astype(str).str.strip().str.replace("[", "", regex=False).str.replace("]", "", regex=False)
    cleaned = cleaned.replace({"": np.nan, "nan": np.nan, "NaN": np.nan})
    return pd.to_numeric(cleaned, errors="coerce")


def ensure_dirs():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)


def write_eligibility_rules():
    rules = pd.DataFrame(ELIGIBILITY_RULES)
    rules.to_csv(OUTPUT_FILES["eligibility_rules"], index=False)
    return rules


def ensure_eligibility_overrides():
    """Create an empty override file if it does not exist.

    Manual review is resolved by adding only reviewed exceptions here, not by
    editing the full screened food table.
    """
    path = OUTPUT_FILES["eligibility_overrides"]
    if not path.exists():
        pd.DataFrame(columns=["Code", "eligibility_status", "reason", "reviewed_by", "review_date"]).to_csv(path, index=False)
    return pd.read_csv(path)


def apply_food_eligibility(base):
    """Screen candidate foods before TOPSIS.

    Clear exclusions and manual-review foods are kept out of TOPSIS. Manual
    review rows are written to outputs/manual-review-required-foods.csv and
    can be resolved through food-eligibility-overrides.csv.
    """
    rules = write_eligibility_rules()
    overrides = ensure_eligibility_overrides()
    screened = base[[col for col in ID_COLUMNS if col in base.columns]].copy()
    screened["eligibility_status"] = "eligible"
    screened["eligibility_reason"] = "No exclusion or review rule matched."
    screened["eligibility_rule_id"] = ""
    screened["eligibility_source"] = "Default project rule"

    for _, rule in rules.iterrows():
        target = screened["Food name in English"] if rule["match_column"] == "food_name" else screened[rule["match_column"]]
        matches = target.fillna("").astype(str).str.contains(str(rule["pattern"]), case=False, regex=True)
        # First matching rule wins, which keeps specific high-risk exclusions
        # from being overwritten by broader category rules.
        update = matches & (screened["eligibility_status"] == "eligible")
        screened.loc[update, "eligibility_status"] = rule["eligibility_status"]
        screened.loc[update, "eligibility_reason"] = rule["reason"]
        screened.loc[update, "eligibility_rule_id"] = rule["rule_id"]
        screened.loc[update, "eligibility_source"] = rule["source"]

    if not overrides.empty:
        required = {"Code", "eligibility_status", "reason"}
        missing = required - set(overrides.columns)
        if missing:
            raise ValueError(f"Eligibility override file is missing columns: {sorted(missing)}")
        for _, override in overrides.dropna(subset=["Code", "eligibility_status"]).iterrows():
            code_mask = screened["Code"].astype(str) == str(override["Code"])
            screened.loc[code_mask, "eligibility_status"] = override["eligibility_status"]
            screened.loc[code_mask, "eligibility_reason"] = override["reason"]
            screened.loc[code_mask, "eligibility_rule_id"] = "OVERRIDE"
            screened.loc[code_mask, "eligibility_source"] = "food-eligibility-overrides.csv"

    screened.to_csv(OUTPUT_FILES["eligibility_screened"], index=False)
    excluded = screened[screened["eligibility_status"].isin(["exclude", "manual_review"])].copy()
    excluded.to_csv(OUTPUT_FILES["eligibility_excluded_log"], index=False)
    manual = screened[screened["eligibility_status"] == "manual_review"].copy()
    manual.to_csv(OUTPUT_FILES["manual_review"], index=False)

    if not manual.empty:
        print(
            f"MANUAL REVIEW REQUIRED: {len(manual)} foods were excluded pending review. "
            f"See {OUTPUT_FILES['manual_review']} and resolve only needed exceptions in "
            f"{OUTPUT_FILES['eligibility_overrides']}."
        )

    eligible_codes = screened.loc[screened["eligibility_status"] == "eligible", "Code"].astype(str)
    return base[base["Code"].astype(str).isin(set(eligible_codes))].copy(), screened


def clean_base():
    """Step 1: load raw WAFCT, remove non-criteria fields, and create net carbs."""
    ensure_dirs()
    if not RAW_WAFCT_FILE.exists():
        raise FileNotFoundError(f"Raw WAFCT file not found: {RAW_WAFCT_FILE}")

    raw = pd.read_excel(RAW_WAFCT_FILE)
    raw = raw[raw["Code"].notna()].copy()
    raw = raw[raw["Code"].astype(str).str.match(r"^\d{2}_\d+$")].copy()

    # Net carbs replaces total carbohydrates so fiber can remain a benefit
    # criterion while carbohydrate load is treated as a cost criterion.
    raw[NET_CARBS_COLUMN] = as_number(raw[TOTAL_CARBS_COLUMN]) - as_number(raw[FIBER_COLUMN])

    model_columns = [item["column"] for item in NUTRIENTS if item["column"] in raw.columns or item["column"] == NET_CARBS_COLUMN]
    keep_columns = [col for col in ID_COLUMNS if col in raw.columns] + model_columns
    base = raw[keep_columns].copy()

    for col in model_columns:
        base[col] = as_number(base[col])

    base.to_csv(OUTPUT_FILES["base"], index=False)

    removed = []
    for column in BASE_DROP_COLUMNS:
        if column in raw.columns:
            removed.append({"column": column, "reason": "Removed before model construction as metadata, duplicate representation, redundant total, or non-criterion field."})
    removed.append({"column": TOTAL_CARBS_COLUMN, "reason": "Replaced by net_carbs = total carbohydrate - fiber."})
    pd.DataFrame(removed).drop_duplicates().to_csv(OUTPUT_DIR / "removed-columns-log.csv", index=False)
    return base


def filter_missingness(threshold=DEFAULT_MISSINGNESS_THRESHOLD):
    """Step 2: retain nutrients by missingness, then remove incomplete food rows."""
    base = pd.read_csv(OUTPUT_FILES["base"]) if OUTPUT_FILES["base"].exists() else clean_base()
    base, _ = apply_food_eligibility(base)
    nutrient_cols = [item["column"] for item in NUTRIENTS if item["column"] in base.columns]
    missingness = pd.DataFrame({
        "nutrient_key": [item["key"] for item in NUTRIENTS if item["column"] in base.columns],
        "nutrient_name": nutrient_cols,
        "missing_fraction": [base[col].isna().mean() for col in nutrient_cols],
    })
    missingness["missing_percent"] = missingness["missing_fraction"] * 100
    missingness["retained"] = missingness["missing_fraction"] <= threshold
    missingness.to_csv(OUTPUT_FILES["missingness"], index=False)

    retained_cols = missingness.loc[missingness["retained"], "nutrient_name"].tolist()
    filtered_before_complete_case = base[[col for col in ID_COLUMNS if col in base.columns] + retained_cols].copy()

    missing_by_food = filtered_before_complete_case[retained_cols].isna()
    remove_mask = missing_by_food.any(axis=1)
    removal_log = filtered_before_complete_case.loc[
        remove_mask, [col for col in ID_COLUMNS if col in filtered_before_complete_case.columns]
    ].copy()
    removal_log["missing_nutrient_count"] = missing_by_food.loc[remove_mask].sum(axis=1).values
    removal_log["missing_nutrients"] = missing_by_food.loc[remove_mask].apply(
        lambda row: "|".join(row.index[row].tolist()),
        axis=1,
    ).values
    removal_log.to_csv(OUTPUT_FILES["complete_case_log"], index=False)

    # Complete-case filtering avoids fabricating nutrient values. Any food with
    # missing information for a retained nutrient is removed before TOPSIS.
    filtered = filtered_before_complete_case.loc[~remove_mask].copy()
    filtered.to_csv(OUTPUT_FILES["filtered"], index=False)

    lookup = {item["column"]: item for item in NUTRIENTS}
    dictionary_rows = []
    direction_rows = []
    for col in retained_cols:
        item = lookup[col]
        dictionary_rows.append({
            "nutrient_key": item["key"],
            "nutrient_name": col,
            "search_terms": "|".join(item["terms"]),
        })
        direction_rows.append({
            "nutrient_key": item["key"],
            "nutrient_name": col,
            "direction": item["direction"],
        })
    pd.DataFrame(dictionary_rows).to_csv(OUTPUT_FILES["nutrient_dictionary"], index=False)
    pd.DataFrame(direction_rows).to_csv(OUTPUT_FILES["directions"], index=False)
    write_deficiency_dictionary()
    return filtered


def write_deficiency_dictionary():
    rows = []
    for key, terms in DEFICIENCY_TERMS_BY_NUTRIENT.items():
        for term in terms:
            rows.append({"nutrient_key": key, "deficiency_term": term, "term_type": "targeted"})
    for term in GENERAL_DEFICIENCY_CONTEXT_TERMS:
        rows.append({"nutrient_key": "general_context", "deficiency_term": term, "term_type": "shared_context"})
    pd.DataFrame(rows).to_csv(OUTPUT_FILES["deficiency_dictionary"], index=False)


def contains_term(text, terms):
    """Case-insensitive phrase matching with word boundaries."""
    for term in terms:
        term = str(term).strip().lower()
        if term and re.search(rf"\b{re.escape(term)}\b", text, flags=re.IGNORECASE):
            return True
    return False


def text_mining_support_counts():
    """Step 3: count PubMed co-occurrences between nutrient and deficiency context."""
    if not PUBMED_FILE.exists():
        raise FileNotFoundError(f"Cached PubMed file not found: {PUBMED_FILE}")
    dictionary = pd.read_csv(OUTPUT_FILES["nutrient_dictionary"])
    abstracts = pd.read_csv(PUBMED_FILE)
    abstracts["title"] = abstracts["title"].fillna("").astype(str)
    abstracts["abstract"] = abstracts["abstract"].fillna("").astype(str)
    abstracts["search_text"] = (abstracts["title"] + " " + abstracts["abstract"]).str.lower()

    nutrient_items = nutrient_lookup()
    flag_cols = ["PMID", "title", "year", "journal"]
    counts = []
    for _, row in dictionary.iterrows():
        key = row["nutrient_key"]
        nutrient_terms = nutrient_items[key]["terms"]
        targeted_terms = DEFICIENCY_TERMS_BY_NUTRIENT.get(key, [])
        # Shared context prevents the scan from requiring every abstract to use
        # one narrow disease label, while targeted terms add high-signal matches
        # such as anemia for iron and night blindness for vitamin A.
        deficiency_terms = sorted(set(targeted_terms + GENERAL_DEFICIENCY_CONTEXT_TERMS))
        flag_col = f"flag_{key}"
        abstracts[flag_col] = abstracts["search_text"].apply(
            lambda text, nts=nutrient_terms, dts=deficiency_terms: int(contains_term(text, nts) and contains_term(text, dts))
        )
        flag_cols.append(flag_col)
        counts.append({
            "nutrient_key": key,
            "nutrient_name": row["nutrient_name"],
            "supporting_abstract_count": int(abstracts[flag_col].sum()),
            "nutrient_search_terms": "|".join(nutrient_terms),
            "deficiency_terms_used": "|".join(deficiency_terms),
        })

    abstracts[flag_cols].to_csv(OUTPUT_FILES["abstract_flags"], index=False)
    counts_df = pd.DataFrame(counts).sort_values("supporting_abstract_count", ascending=False)
    counts_df.to_csv(OUTPUT_FILES["support_counts"], index=False)
    return counts_df


def build_weights():
    counts = pd.read_csv(OUTPUT_FILES["support_counts"])
    weights = counts[counts["supporting_abstract_count"] > 0].copy()
    if weights.empty:
        raise ValueError("All nutrients have zero PubMed support; cannot build weights.")
    weights["weight"] = weights["supporting_abstract_count"] / weights["supporting_abstract_count"].sum()
    weights.to_csv(OUTPUT_FILES["weights"], index=False)
    return weights


def build_decision_matrices():
    """Steps 4-6: raw, vector-normalized, and weighted decision matrices."""
    filtered = pd.read_csv(OUTPUT_FILES["filtered"])
    weights = pd.read_csv(OUTPUT_FILES["weights"])
    directions = pd.read_csv(OUTPUT_FILES["directions"])
    common = sorted(set(filtered.columns) & set(weights["nutrient_name"]) & set(directions["nutrient_name"]))
    ids = filtered[[col for col in TOPSIS_ID_COLUMNS if col in filtered.columns]].copy()

    raw_matrix = filtered[common].copy().apply(pd.to_numeric, errors="coerce")
    missing_after_complete_case = int(raw_matrix.isna().sum().sum())
    if missing_after_complete_case:
        raise ValueError(
            f"Decision matrix still contains {missing_after_complete_case} missing values. "
            "Complete-case filtering must remove foods with missing retained nutrient data."
        )
    pd.concat([ids, raw_matrix], axis=1).to_csv(OUTPUT_FILES["raw_matrix"], index=False)

    norm = np.sqrt((raw_matrix.values ** 2).sum(axis=0))
    normalized = np.divide(raw_matrix.values, norm, out=np.zeros_like(raw_matrix.values), where=norm != 0)
    normalized_df = pd.DataFrame(normalized, columns=common)
    pd.concat([ids, normalized_df], axis=1).to_csv(OUTPUT_FILES["normalized_matrix"], index=False)

    aligned_weights = weights.set_index("nutrient_name").loc[common].reset_index()
    weighted = normalized_df.values * aligned_weights["weight"].values
    weighted_df = pd.DataFrame(weighted, columns=common)
    pd.concat([ids, weighted_df], axis=1).to_csv(OUTPUT_FILES["weighted_matrix"], index=False)
    return common


def run_topsis():
    """Step 7: calculate ideal/worst solutions, distances, scores, and ranks."""
    weighted = pd.read_csv(OUTPUT_FILES["weighted_matrix"])
    directions = pd.read_csv(OUTPUT_FILES["directions"]).set_index("nutrient_name")
    id_cols = [col for col in TOPSIS_ID_COLUMNS if col in weighted.columns]
    nutrient_cols = [col for col in weighted.columns if col not in id_cols]
    X = weighted[nutrient_cols].values.astype(float)

    ideal = []
    worst = []
    for i, col in enumerate(nutrient_cols):
        direction = directions.loc[col, "direction"]
        values = X[:, i]
        if direction == "benefit":
            ideal.append(values.max())
            worst.append(values.min())
        else:
            ideal.append(values.min())
            worst.append(values.max())

    ideal = np.array(ideal)
    worst = np.array(worst)
    dist_ideal = np.sqrt(((X - ideal) ** 2).sum(axis=1))
    dist_worst = np.sqrt(((X - worst) ** 2).sum(axis=1))
    scores = dist_worst / (dist_ideal + dist_worst)

    pd.DataFrame({
        "nutrient_name": nutrient_cols,
        "ideal_best": ideal,
        "ideal_worst": worst,
        "direction": [directions.loc[col, "direction"] for col in nutrient_cols],
    }).to_csv(OUTPUT_FILES["ideal_worst"], index=False)

    results = weighted[id_cols].copy()
    results["topsis_score"] = scores
    results["distance_to_ideal"] = dist_ideal
    results["distance_to_worst"] = dist_worst
    results["rank"] = results["topsis_score"].rank(ascending=False, method="min")
    results = results.sort_values("topsis_score", ascending=False).reset_index(drop=True)
    results.to_csv(OUTPUT_FILES["topsis"], index=False)
    return results


def clean_label(value, max_len=54):
    value = str(value).replace("\n", " ")
    return value if len(value) <= max_len else value[: max_len - 3] + "..."


def build_rdi_coverage(top_n=25):
    """Build post-hoc RDI coverage from complete-case filtered foods."""
    topsis = pd.read_csv(OUTPUT_FILES["topsis"]).head(top_n)
    data = pd.read_csv(OUTPUT_FILES["filtered"])
    merged = topsis.merge(data, on=TOPSIS_ID_COLUMNS, how="left")

    rows = []
    for _, row in merged.iterrows():
        for nutrient, rdi in RDI.items():
            if nutrient not in row.index:
                continue
            value = pd.to_numeric(row[nutrient], errors="coerce")
            rows.append({
                "Code": row["Code"],
                "Food name in English": row["Food name in English"],
                "rank": row["rank"],
                "topsis_score": row["topsis_score"],
                "nutrient": nutrient,
                "value_per_100g": value,
                "rdi": rdi,
                "percent_rdi": (value / rdi) * 100 if pd.notna(value) else pd.NA,
            })

    long = pd.DataFrame(rows)
    long.to_csv(OUTPUT_FILES["rdi_long"], index=False)
    wide = long.pivot_table(
        index=["Code", "Food name in English", "rank", "topsis_score"],
        columns="nutrient",
        values="percent_rdi",
    ).reset_index()
    wide.to_csv(OUTPUT_FILES["rdi_wide"], index=False)
    return long, wide


def generate_figures():
    """Create interpretation-ready figures and omit redundant old figures."""
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)
    support = pd.read_csv(OUTPUT_FILES["support_counts"]).sort_values("supporting_abstract_count", ascending=True)
    supported = support[support["supporting_abstract_count"] > 0]

    fig, ax = plt.subplots(figsize=(10, max(5, len(supported) * 0.32)))
    bars = ax.barh([clean_label(v) for v in supported["nutrient_name"]], supported["supporting_abstract_count"], color=PALETTE["blue"])
    ax.set_title("Figure 1. PubMed Abstract Support Counts by Nutrient")
    ax.set_xlabel("Supporting abstracts with nutrient and deficiency-context co-occurrence")
    ax.set_ylabel("Nutrient")
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 1, bar.get_y() + bar.get_height() / 2, f"{int(width)}", va="center", fontsize=8)
    ax.text(0.01, 0.01, "Interpretation: larger counts receive larger literature-derived weights after normalization.", transform=ax.transAxes, fontsize=9)
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "figure-1-abstract-support-counts.png", dpi=150)
    plt.close()

    scores = pd.read_csv(OUTPUT_FILES["topsis"])
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(scores["topsis_score"], bins=35, color=PALETTE["green"], edgecolor="black", alpha=0.85)
    ax.set_title("TOPSIS Score Distribution Across Eligible Complete-Case Foods")
    ax.set_xlabel("TOPSIS score")
    ax.set_ylabel("Number of foods")
    mean_score = scores["topsis_score"].mean()
    median_score = scores["topsis_score"].median()
    spread = scores["topsis_score"].quantile(0.9) - scores["topsis_score"].quantile(0.1)
    ax.axvline(mean_score, color=PALETTE["red"], linestyle="--", linewidth=1.5, label=f"Mean = {mean_score:.3f}")
    ax.axvline(median_score, color=PALETTE["purple"], linestyle=":", linewidth=1.8, label=f"Median = {median_score:.3f}")
    ax.text(0.02, 0.95, f"Ranking spread: P90 - P10 = {spread:.3f}", transform=ax.transAxes, va="top")
    ax.legend()
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "topsis-score-distribution.png", dpi=150)
    plt.close()

    top = scores.head(20).sort_values("topsis_score", ascending=True)
    fig, ax = plt.subplots(figsize=(10, 7))
    bars = ax.barh([clean_label(v) for v in top["Food name in English"]], top["topsis_score"], color=PALETTE["orange"])
    ax.set_title("Top 20 Eligible Complete-Case Foods by Literature-Weighted TOPSIS Score")
    ax.set_xlabel("TOPSIS score")
    ax.set_ylabel("Food")
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.005, bar.get_y() + bar.get_height() / 2, f"{width:.3f}", va="center", fontsize=8)
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "top-20-foods-topsis-score.png", dpi=150)
    plt.close()

    build_rdi_coverage(top_n=25)
    rdi_wide = pd.read_csv(OUTPUT_FILES["rdi_wide"]).sort_values("rank").head(10)
    rdi_cols = [col for col in rdi_wide.columns if col not in ["Code", "Food name in English", "rank", "topsis_score"]]
    if rdi_cols:
        heatmap = rdi_wide[rdi_cols].clip(upper=100).values
        fig, ax = plt.subplots(figsize=(12, 7))
        image = ax.imshow(heatmap, aspect="auto", cmap="YlGnBu", vmin=0, vmax=100)
        ax.set_title("RDI Coverage Heatmap for Top 10 Eligible Complete-Case Foods")
        ax.set_xlabel("Nutrient")
        ax.set_ylabel("Food ranked by TOPSIS")
        ax.set_xticks(range(len(rdi_cols)))
        ax.set_xticklabels([clean_label(col.replace("_percent_rdi", ""), 26) for col in rdi_cols], rotation=45, ha="right", fontsize=8)
        ax.set_yticks(range(len(rdi_wide)))
        ax.set_yticklabels([clean_label(v, 34) for v in rdi_wide["Food name in English"]], fontsize=8)
        for i in range(heatmap.shape[0]):
            for j in range(heatmap.shape[1]):
                value = heatmap[i, j]
                if pd.notna(value):
                    ax.text(j, i, f"{value:.0f}", ha="center", va="center", fontsize=6, color="black" if value < 65 else "white")
        cbar = fig.colorbar(image, ax=ax)
        cbar.set_label("% RDI per 100g, capped at 100 for display")
        plt.tight_layout()
        plt.savefig(FIGURE_DIR / "rdi-coverage-heatmap-top-10-foods.png", dpi=150)
        plt.close()


def remove_retired_figures():
    # Retire legacy underscore/numbered figures so the figure directory reflects
    # only the dashed, interpretation-ready outputs from this pipeline.
    keep = {
        "figure-1-abstract-support-counts.png",
        "topsis-score-distribution.png",
        "top-20-foods-topsis-score.png",
        "rdi-coverage-heatmap-top-10-foods.png",
    }
    for path in FIGURE_DIR.glob("*.png"):
        if path.name not in keep:
            path.unlink()


def run_pipeline(threshold=DEFAULT_MISSINGNESS_THRESHOLD):
    threshold = parse_threshold(threshold)
    clean_base()
    filter_missingness(threshold)
    text_mining_support_counts()
    build_weights()
    nutrients = build_decision_matrices()
    results = run_topsis()
    build_rdi_coverage(top_n=25)
    generate_figures()
    remove_retired_figures()
    filtered_rows = len(pd.read_csv(OUTPUT_FILES["filtered"]))
    removed_rows = len(pd.read_csv(OUTPUT_FILES["complete_case_log"]))
    eligibility = pd.read_csv(OUTPUT_FILES["eligibility_screened"])
    eligibility_counts = eligibility["eligibility_status"].value_counts()
    summary = [
        f"missingness-threshold={threshold:.2%}",
        f"foods-eligible-before-missingness-filter={int(eligibility_counts.get('eligible', 0))}",
        f"foods-excluded-by-eligibility-filter={int(eligibility_counts.get('exclude', 0))}",
        f"foods-pending-manual-review={int(eligibility_counts.get('manual_review', 0))}",
        f"nutrients-used-in-topsis={len(nutrients)}",
        f"foods-ranked={len(results)}",
        f"foods-after-complete-case-filter={filtered_rows}",
        f"foods-removed-for-missing-retained-nutrients={removed_rows}",
        f"top-food={results.iloc[0]['Food name in English']}"
    ]
    (OUTPUT_DIR / "pipeline-run-summary.txt").write_text("\n".join(summary))
    print("\n".join(summary))


def main():
    parser = argparse.ArgumentParser(description="Run the nutrition ranking pipeline.")
    parser.add_argument("--threshold", default=DEFAULT_MISSINGNESS_THRESHOLD, type=parse_threshold)
    args = parser.parse_args()
    run_pipeline(args.threshold)


if __name__ == "__main__":
    main()
