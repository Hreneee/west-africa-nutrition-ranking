import csv
import os
import time
import requests
import xml.etree.ElementTree as ET
from pathlib import Path

# --------------------------------------------------
# 1. Project paths
# --------------------------------------------------

# Resolve project root based on this script's location:
# scripts/03_fetch_pubmed.py -> parent of parent = project root
project_root = Path(__file__).resolve().parents[1]

# Output CSV path
output_file = project_root / "data" / "processed" / "pubmed-west-africa-deficiency-2015-present.csv"

# Make sure processed folder exists
output_file.parent.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------
# 2. PubMed query
# --------------------------------------------------

QUERY = r'''
(
  "West Africa"[Title/Abstract]
  OR Benin[Title/Abstract]
  OR "Burkina Faso"[Title/Abstract]
  OR "Cabo Verde"[Title/Abstract]
  OR "Cape Verde"[Title/Abstract]
  OR "Cote d'Ivoire"[Title/Abstract]
  OR "Ivory Coast"[Title/Abstract]
  OR Gambia[Title/Abstract]
  OR Ghana[Title/Abstract]
  OR Guinea[Title/Abstract]
  OR "Guinea-Bissau"[Title/Abstract]
  OR Liberia[Title/Abstract]
  OR Mali[Title/Abstract]
  OR Mauritania[Title/Abstract]
  OR Niger[Title/Abstract]
  OR Nigeria[Title/Abstract]
  OR Senegal[Title/Abstract]
  OR "Sierra Leone"[Title/Abstract]
  OR Togo[Title/Abstract]
)
AND
(
  "nutritional deficiency"[Title]
  OR "micronutrient deficiency"[Title]
  OR "iron deficiency"[Title]
  OR "vitamin A deficiency"[Title]
  OR "zinc deficiency"[Title]
  OR "dietary deficiency"[Title]
  OR malnutrition[Title]
  OR undernutrition[Title]
  OR anemia[Title]
  OR anaemia[Title]
)
AND
(
  2015:2026[pdat]
)
AND humans[MeSH Terms]
AND english[lang]
'''.strip()

# --------------------------------------------------
# 3. NCBI E-utilities settings
# --------------------------------------------------

BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
DB = "pubmed"

TOOL = "west_africa_nutrition_project"

EMAIL = os.getenv("NCBI_EMAIL", "")
API_KEY = os.getenv("NCBI_API_KEY")

# --------------------------------------------------
# 4. Helper: build common params
# --------------------------------------------------

def common_params():
    if not EMAIL:
        raise RuntimeError(
            "NCBI_EMAIL is required when refetching PubMed records. "
            "Set it in your shell environment; do not hard-code it in this script."
        )

    params = {
        "db": DB,
        "tool": TOOL,
        "email": EMAIL,
    }
    if API_KEY:
        params["api_key"] = API_KEY
    return params

# --------------------------------------------------
# 5. Run ESearch
# --------------------------------------------------

def esearch(query: str):
    """
    Run ESearch to get:
    - count of matching PubMed records
    - WebEnv and QueryKey for server-side history
    """
    url = f"{BASE_URL}/esearch.fcgi"
    params = common_params()
    params.update({
        "term": query,
        "usehistory": "y",   # store results on NCBI history server
        "retmode": "json",
        "retmax": 0          # we only need count/history here
    })

    response = requests.get(url, params=params, timeout=60)
    response.raise_for_status()

    data = response.json()["esearchresult"]
    count = int(data["count"])
    webenv = data["webenv"]
    query_key = data["querykey"]

    return count, webenv, query_key

# --------------------------------------------------
# 6. Parse PubMed XML record helpers
# --------------------------------------------------

def get_text(elem, path, default=""):
    """
    Safe XML text extraction.
    """
    node = elem.find(path)
    if node is not None and node.text:
        return node.text.strip()
    return default

def extract_title(article):
    """
    Extract article title from PubMed XML.
    """
    title_node = article.find(".//ArticleTitle")
    if title_node is None:
        return ""
    return "".join(title_node.itertext()).strip()

def extract_abstract(article):
    """
    Extract abstract text. Some records have multiple AbstractText sections.
    """
    abstract_nodes = article.findall(".//Abstract/AbstractText")
    if not abstract_nodes:
        return ""

    parts = []
    for node in abstract_nodes:
        label = node.attrib.get("Label")
        text = "".join(node.itertext()).strip()
        if not text:
            continue
        if label:
            parts.append(f"{label}: {text}")
        else:
            parts.append(text)

    return " ".join(parts).strip()

def extract_year(article):
    """
    Try to extract publication year using a fallback order:
    1. PubDate/Year
    2. ArticleDate/Year
    3. MedlineDate (first 4-digit year if present)
    """
    year = get_text(article, ".//PubDate/Year")
    if year:
        return year

    year = get_text(article, ".//ArticleDate/Year")
    if year:
        return year

    medline_date = get_text(article, ".//PubDate/MedlineDate")
    if medline_date:
        # crude fallback: grab first 4 consecutive digits
        import re
        match = re.search(r"\b(19|20)\d{2}\b", medline_date)
        if match:
            return match.group(0)

    return ""

def extract_journal(article):
    """
    Extract journal title.
    """
    return get_text(article, ".//Journal/Title")

# --------------------------------------------------
# 7. Run EFetch in batches
# --------------------------------------------------

def efetch_batch(webenv: str, query_key: str, retstart: int, retmax: int = 200):
    """
    Fetch a batch of PubMed records in XML format.
    """
    url = f"{BASE_URL}/efetch.fcgi"
    params = common_params()
    params.update({
        "query_key": query_key,
        "WebEnv": webenv,
        "retstart": retstart,
        "retmax": retmax,
        "retmode": "xml"
    })

    response = requests.get(url, params=params, timeout=120)
    response.raise_for_status()
    return response.text

# --------------------------------------------------
# 8. Main retrieval pipeline
# --------------------------------------------------

def main():
    print("Running ESearch...")
    count, webenv, query_key = esearch(QUERY)
    print(f"Total PubMed records found: {count}")

    batch_size = 200
    rows = []

    for start in range(0, count, batch_size):
        print(f"Fetching records {start + 1} to {min(start + batch_size, count)}...")
        xml_text = efetch_batch(webenv, query_key, retstart=start, retmax=batch_size)

        root = ET.fromstring(xml_text)
        articles = root.findall(".//PubmedArticle")

        for pubmed_article in articles:
            pmid = get_text(pubmed_article, ".//MedlineCitation/PMID")
            title = extract_title(pubmed_article)
            abstract = extract_abstract(pubmed_article)
            year = extract_year(pubmed_article)
            journal = extract_journal(pubmed_article)

            rows.append({
                "PMID": pmid,
                "title": title,
                "abstract": abstract,
                "year": year,
                "journal": journal
            })

        # Be polite to NCBI servers; if you have no API key, keep requests modest
        time.sleep(0.34 if API_KEY else 0.5)

    print(f"Writing CSV to: {output_file}")
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["PMID", "title", "abstract", "year", "journal"]
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Done. Saved {len(rows)} records.")

if __name__ == "__main__":
    main()
