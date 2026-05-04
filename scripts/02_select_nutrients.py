import argparse

from pipeline import DEFAULT_MISSINGNESS_THRESHOLD, filter_missingness, parse_threshold


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply parameterized nutrient missingness filtering.")
    parser.add_argument("--threshold", default=DEFAULT_MISSINGNESS_THRESHOLD, type=parse_threshold)
    args = parser.parse_args()
    filter_missingness(args.threshold)
    print("Saved data/processed/wafct-nutrients-filtered.csv")
