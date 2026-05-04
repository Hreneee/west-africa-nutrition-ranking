from pipeline import apply_food_eligibility, clean_base


if __name__ == "__main__":
    base = clean_base()
    eligible, screened = apply_food_eligibility(base)
    print(f"Saved food eligibility screening for {len(screened)} foods.")
    print(f"Eligible foods retained before missingness filtering: {len(eligible)}")
