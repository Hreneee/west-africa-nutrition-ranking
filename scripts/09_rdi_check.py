from pipeline import build_rdi_coverage


if __name__ == "__main__":
    build_rdi_coverage(top_n=25)
    print("Saved complete-case RDI coverage outputs.")
