# West Africa Nutrition Ranking Project

This project targets a resource-constrained population health problem by ranking foods in West Africa. The goal is not to produce a generic nutrient-density score. The pipeline combines food composition data, PubMed-derived deficiency signals, and TOPSIS multi-criteria decision analysis so rankings reflect region-relevant nutrition priorities.

The PubMed component is a structured literature scan, not a systematic review. The output should be interpreted as a transparent prioritization tool, not a definitive policy recommendation.

## Current Pipeline Status

The current pipeline uses dashed, threshold-agnostic filenames. 

Latest verified default run:

- Total WAFCT foods screened: `1028`
- Excluded by eligibility filter: `26`
- Pending manual review and excluded until resolved: `2`
- Eligible before complete-case filtering: `1000`
- Missingness threshold: `10%`
- Foods removed for missing retained nutrient data: `166`
- Foods ranked: `834`
- Nutrients used in TOPSIS: `17`

The latest run summary is saved at:

```text
outputs/pipeline-run-summary.txt
```

## Directory Layout

```text
west-africa-nutrition-ranking/
  data/
    raw/
      wafct_raw.xlsx
    processed/
      dashed pipeline outputs
  outputs/
    figures/
    pipeline-run-summary.txt
    removed-columns-log.csv
  scripts/
    config.py
    pipeline.py
    run-pipeline.py
    01_clean_wafct.py
    ...
    10_generate_figures.py
```

## Requirements

Use the project virtual environment if it already exists:

```bash
.venv/bin/python scripts/run-pipeline.py
```

If you need to recreate the environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The pipeline uses the cached PubMed file:

```text
data/processed/pubmed-west-africa-deficiency-2015-present.csv
```

Do not refetch PubMed unless you intentionally want to update the literature record set.

If PubMed must be refetched, set an NCBI contact email in the environment before running the fetch script:

```bash
export NCBI_EMAIL="your-email@example.com"
.venv/bin/python scripts/03_fetch_pubmed.py
```

An optional `NCBI_API_KEY` environment variable may also be set for authenticated NCBI requests. Do not commit API keys or personal credentials.

## Data and Reproducibility Notes

This repository includes the small raw WAFCT workbook and cached PubMed abstract file used by the current run so the pipeline can be reproduced without changing the literature record set.

Data sources:

- WAFCT raw data: FAO/INFOODS West African Food Composition Table.
- PubMed abstract cache: structured scan results saved at `data/processed/pubmed-west-africa-deficiency-2015-present.csv`.
- Eligibility rationale sources are documented in Step 2 below.

The cached PubMed file should be treated as an input snapshot. Refetching PubMed can change support counts and TOPSIS weights because the indexed literature set can change over time.

## Recommended Run Command

Run the full default pipeline at the 10% missingness threshold:

```bash
.venv/bin/python scripts/run-pipeline.py
```

Run a different threshold, such as 5%, 10%, or 15%:

```bash
.venv/bin/python scripts/run-pipeline.py --threshold 5
.venv/bin/python scripts/run-pipeline.py --threshold 10
.venv/bin/python scripts/run-pipeline.py --threshold 15
```

Decimal thresholds also work:

```bash
.venv/bin/python scripts/run-pipeline.py --threshold 0.15
```

After running a non-default threshold for testing, rerun the default command if you want the outputs on disk to reflect the default 10% state.

## Interactive Dashboard Prototype

A polished one-page React + TypeScript + Vite dashboard prototype is available in:

```text
dashboard/
```

It demonstrates how the research pipeline could be translated into a public-facing decision-support interface. The prototype includes KPI cards, search and filter controls, score and literature-signal charts, a searchable results table, and interpretation notes.

The dashboard currently uses realistic sample records in:

```text
dashboard/src/data/sampleDashboardData.ts
```

The sample data is intentionally isolated so it can be replaced later with parsed CSV/JSON exports from the real pipeline.

Run locally:

```bash
cd dashboard
npm install
npm run dev
```

Build for deployment:

```bash
cd dashboard
npm run build
npm run preview
```

Deploy to GitHub Pages with the included `gh-pages` script:

```bash
cd dashboard
npm run deploy
```

The dashboard uses `base: "./"` in `dashboard/vite.config.ts`, which keeps the build portable for GitHub Pages project hosting.

## Pipeline Order

The full pipeline is implemented in:

```text
scripts/pipeline.py
```

The safest way to run everything is `scripts/run-pipeline.py`. The numbered scripts are also available for step-by-step execution.

### Step 1: Base Cleaning

Command:

```bash
.venv/bin/python scripts/01_clean_wafct.py
```

Input:

```text
data/raw/wafct_raw.xlsx
```

Operations:

- Keep valid WAFCT food rows.
- Preserve food identifiers: `Code`, `Food name in English`, and `Scientific name`.
- Remove non-nutrients fields such as water, ash, alcohol, energy, metadata, conversion factors, redundant totals, and duplicate nutrient forms.
- Replace total carbohydrate with `net_carbs = total_carbs - fiber`.
- Remove total carbohydrate from the model after constructing net carbs.

Outputs:

```text
data/processed/wafct-clean-base.csv
outputs/removed-columns-log.csv
```

### Step 2: Food Eligibility Screening

Command:

```bash
.venv/bin/python scripts/02_screen_food_eligibility.py
```

Operations:

- Apply frozen local eligibility rules before missingness filtering and TOPSIS.
- Exclude non-recommendable food composition entries such as culinary additives, caustic compounds, minor-use condiments, spices, sweeteners, and seasoning ingredients.
- Exclude `manual_review` foods from TOPSIS until reviewed.
- Write a direct alert file when manual review is needed.
- Create an empty override file if one does not already exist.

Outputs:

```text
data/processed/food-eligibility-rules.csv
data/processed/food-eligibility-screened.csv
data/processed/food-eligibility-excluded-log.csv
data/processed/food-eligibility-overrides.csv
outputs/manual-review-required-foods.csv
```

Manual review behavior:

- The pipeline prints `MANUAL REVIEW REQUIRED` when review-pending foods exist.
- Review-pending foods are excluded from TOPSIS by default.
- Do not edit `food-eligibility-screened.csv`; it is regenerated each run.
- To approve or exclude a reviewed exception, add only that food to `food-eligibility-overrides.csv`.

Default statuses:

- `eligible`: included in later pipeline steps.
- `exclude`: excluded before missingness filtering and TOPSIS.
- `manual_review`: excluded before TOPSIS until resolved by override.

Example override:

|  Code | Eligibility Status | Reason | Reviewed By | Review Date |
|---|---|---|---|---|
|`13_017`| `eligible` | Approved as intentionally analyzed nutrient-dense ingredient. | Irene | `2026-05-03` |
| `13_018` | `exclude` | Condiment or yeast extract; not a standalone food recommendation. | Irene | `2026-05-03` |


After editing the override file, rerun:

```bash
.venv/bin/python scripts/run-pipeline.py
```

The eligibility filter exists because WAFCT is a food composition reference, not a list of standalone food recommendations. WAFCT includes foods, ingredients, recipes, condiments, additives, and recipe-calculation items. That is useful for nutrient composition work, but a TOPSIS ranking for food prioritization should not rank caustic compounds, processing aids, or tiny-use condiments as recommended foods.

Source basis:

- FAO/INFOODS describes WAFCT 2019 as an expanded food composition table with foods and recipes for Western Africa and provides both a user guide and datasheets: [FAO/INFOODS databases](https://www.fao.org/infoods/infoods/tables-and-databases/faoinfoods-databases/en/).
- AGRIS/FAO describes food composition data as supporting nutrition-sensitive agriculture, processing, labelling, food-based dietary guidelines, nutrition education, communication, and legislation: [AGRIS WAFCT record](https://agris.fao.org/search/en/records/64746e10d2d44cfaede23fa3).
- MedlinePlus identifies potassium carbonate and potassium hydroxide as caustic poisoning hazards, which supports excluding `Potash, solid` from direct food recommendations: [potassium carbonate](https://medlineplus.gov/ency/article/002481.htm), [potassium hydroxide](https://medlineplus.gov/ency/article/002482.htm).

The current default rules exclude clear non-recommendable entries such as:

- `Potash, solid`
- `Baking soda (sodium bicarbonate)`
- `Salt`
- seasoning cubes
- vinegar
- code group `13` condiments, spices, additives, sweeteners, and minor-use ingredients
- Ovaltine beverage/powder products

Manual review currently flags:

- `Yeast, dried`
- `Yeast extract, Marmite`

Manual review is intentionally small. If you decide a flagged item should enter the ranking, add a single row to `food-eligibility-overrides.csv` and rerun the pipeline. This avoids manually editing the entire screened food table.

### Step 3: Missing Data Filtering

Command:

```bash
.venv/bin/python scripts/02_select_nutrients.py --threshold 10
```

Operations:

- Calculate missingness for model nutrient columns.
- Use only foods that passed eligibility screening.
- Retain nutrients with missingness less than or equal to the threshold.
- Remove any food that still has missing data for any retained nutrient.
- Write the nutrient dictionary with search terms.
- Write nutrient directionality.
- Write the deficiency dictionary.

Outputs:

```text
data/processed/wafct-nutrients-filtered.csv
data/processed/complete-case-food-removal-log.csv
data/processed/missingness-summary.csv
data/processed/nutrient-dictionary.csv
data/processed/nutrient-directions.csv
data/processed/deficiency-dictionary.csv
```

### Step 4: Text Mining Support Counts

Command:

```bash
.venv/bin/python scripts/05_text_mining.py
```

Operations:

- Load cached PubMed title and abstract records.
- Detect nutrient terms using case-insensitive regex matching with word boundaries.
- Count a nutrient at most once per abstract.
- Count support only when a nutrient term co-occurs with deficiency context.
- Use targeted deficiency terms where available, such as anemia for iron and night blindness for vitamin A.
- Avoid blanket generation of noisy `<nutrient> deficiency` terms for every nutrient.

Outputs:

```text
data/processed/abstract-nutrient-flags.csv
data/processed/nutrient-abstract-support-counts.csv
```

### Step 5: Nutrient Weight Construction

Command:

```bash
.venv/bin/python scripts/06_build_nutrient_weights.py
```

Operations:

- Remove nutrients with zero supporting abstracts.
- Normalize positive support counts so weights sum to 1.

Output:

```text
data/processed/nutrient-weights.csv
```

### Step 6: Raw Decision Matrix

Command:

```bash
.venv/bin/python scripts/07_build_decision_matrix.py
```

Operations:

- Keep foods and nutrients present in all required inputs:
  WAFCT filtered data, positive-support weights, and directionality.
- Convert nutrient values to numeric.
- Stop with an error if any missing nutrient value remains.
- Use only foods retained by eligibility screening and complete-case filtering.
- Save the raw matrix before normalization.

Output:

```text
data/processed/decision-matrix-raw.csv
```

### Step 7: Normalized Decision Matrix

Performed by the same command as Step 6:

```bash
.venv/bin/python scripts/07_build_decision_matrix.py
```

Operation:

- Apply vector normalization to each nutrient column.

Output:

```text
data/processed/decision-matrix-normalized.csv
```

### Step 8: Weighted Decision Matrix

Performed by the same command as Step 6:

```bash
.venv/bin/python scripts/07_build_decision_matrix.py
```

Operation:

- Multiply each normalized nutrient column by its literature-derived weight.

Output:

```text
data/processed/decision-matrix-weighted.csv
```

### Step 9: TOPSIS Results

Command:

```bash
.venv/bin/python scripts/08_run_topsis.py
```

Operations:

- Determine ideal best and ideal worst values for each nutrient.
- Use nutrient directionality:
  `benefit` means higher is better; `cost` means lower is better.
- Calculate Euclidean distance to ideal best and ideal worst.
- Calculate the TOPSIS closeness coefficient.
- Rank foods in descending score order using `method="min"`.

Outputs:

```text
data/processed/topsis-ideal-worst-solutions.csv
data/processed/topsis-results.csv
```

TOPSIS is fully inspectable through three matrix files plus the final result:

```text
decision-matrix-raw.csv
decision-matrix-normalized.csv
decision-matrix-weighted.csv
topsis-results.csv
```

Use these files to verify the transformation from nutrient values to normalized values, weighted values, distances, scores, and ranks.

The raw decision matrix is complete-case only. Missing nutrient values are not imputed. If missing values survive the complete-case filtering step, the pipeline raises an error instead of silently filling them.

### Step 10: Post-Hoc RDI Coverage

Command:

```bash
.venv/bin/python scripts/09_rdi_check.py
```

RDI coverage is post-hoc interpretation only. It is not part of TOPSIS scoring.

The RDI files use the refined eligible and complete-case TOPSIS results. Foods removed by eligibility screening or missing retained nutrient data are not included.

Outputs:

```text
data/processed/rdi-coverage-top-foods-long.csv
data/processed/rdi-coverage-top-foods-wide.csv
```

### Step 11: Figures

Command:

```bash
.venv/bin/python scripts/10_generate_figures.py
```

Current figures:

```text
outputs/figures/figure-1-abstract-support-counts.png
outputs/figures/topsis-score-distribution.png
outputs/figures/top-20-foods-topsis-score.png
outputs/figures/rdi-coverage-heatmap-top-10-foods.png
```

Figure rules:

- Figures use dashed filenames.
- Figures use the standard project palette:
  blue for literature support, green for distributions, orange for top-ranked foods, and blue-green heatmap scaling for RDI coverage.
- Figure 1 explains abstract support counts.
- Bar plots print exact support counts or TOPSIS scores directly on the figure.
- The TOPSIS distribution figure shows score spread rather than only reporting a mean.

## Processed Outputs

The active processed outputs are:

```text
data/processed/wafct-clean-base.csv
data/processed/food-eligibility-rules.csv
data/processed/food-eligibility-screened.csv
data/processed/food-eligibility-excluded-log.csv
data/processed/food-eligibility-overrides.csv
data/processed/wafct-nutrients-filtered.csv
data/processed/complete-case-food-removal-log.csv
data/processed/missingness-summary.csv
data/processed/nutrient-dictionary.csv
data/processed/nutrient-directions.csv
data/processed/deficiency-dictionary.csv
data/processed/abstract-nutrient-flags.csv
data/processed/nutrient-abstract-support-counts.csv
data/processed/nutrient-weights.csv
data/processed/decision-matrix-raw.csv
data/processed/decision-matrix-normalized.csv
data/processed/decision-matrix-weighted.csv
data/processed/topsis-ideal-worst-solutions.csv
data/processed/topsis-results.csv
data/processed/rdi-coverage-top-foods-long.csv
data/processed/rdi-coverage-top-foods-wide.csv
outputs/manual-review-required-foods.csv
```

## Troubleshooting

If the run fails:

1. Confirm the raw workbook exists:

   ```text
   data/raw/wafct_raw.xlsx
   ```

2. Confirm the cached PubMed file exists:

   ```text
   data/processed/pubmed-west-africa-deficiency-2015-present.csv
   ```

3. Run the full pipeline instead of individual scripts:

   ```bash
   .venv/bin/python scripts/run-pipeline.py
   ```

4. If you run individual scripts, run them in the numbered order.

5. Check the latest run summary:

   ```text
   outputs/pipeline-run-summary.txt
   ```
