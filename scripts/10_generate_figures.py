from pipeline import generate_figures, remove_retired_figures


if __name__ == "__main__":
    generate_figures()
    remove_retired_figures()
    print("Saved updated figures with dashed filenames.")
