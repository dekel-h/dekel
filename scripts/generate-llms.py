#!/usr/bin/env python3
"""Regenerate llms.txt from the site's HTML.

Sources of truth:
- index.html: meta description (summary), hero intro (bio),
  company sections (experience), notable-projects lines.
- Each case-study page: <h1> (title) and meta description.

Run from the repo root: python3 scripts/generate-llms.py
The GitHub Action in .github/workflows/update-llms.yml runs this on
every push to main and commits the result when it changed.
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = "https://dekelhillel.com"
CASE_DIRS = ["transaction-log", "ownera-investor", "placer-lite"]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def strip_tags(fragment):
    text = re.sub(r"<br\s*/?>", "\n", fragment)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text)


def collapse(text):
    return re.sub(r"\s+", " ", text).strip()


def meta_description(doc):
    m = re.search(r'name="description"\s+content="([^"]*)"', doc)
    return html.unescape(m.group(1)) if m else ""


def first_match(pattern, doc, label):
    m = re.search(pattern, doc, re.S)
    if not m:
        sys.exit(f"generate-llms: could not find {label}")
    return m.group(1)


def main():
    index = read("index.html")

    summary = meta_description(index)

    intro_html = first_match(
        r'<p class="intro"[^>]*>(.*?)</p>', index, "hero intro in index.html"
    )
    # Keep the intro's sentence flow: paragraph breaks become one line each.
    intro_lines = [collapse(l) for l in strip_tags(intro_html).split("\n")]
    bio = " ".join(l for l in intro_lines if l)
    # When the meta description just mirrors the intro, one copy is enough.
    if collapse(summary) == bio:
        bio = ""

    # Case studies: title from each page's <h1>, blurb from its meta description.
    cases = []
    for d in CASE_DIRS:
        doc = read(f"{d}/index.html")
        title = collapse(strip_tags(first_match(
            r"<h1[^>]*>(.*?)</h1>", doc, f"<h1> in {d}/index.html"
        )))
        blurb = meta_description(doc)
        # Meta descriptions open with the page title — drop the repeat.
        if blurb.startswith(title):
            blurb = blurb[len(title):].lstrip(" .")
        cases.append((title, f"{BASE_URL}/{d}/", blurb))

    # Experience: each .company section, plus the nearest following
    # note/notable paragraph (searched within the section's tail).
    experience = []
    sections = re.findall(
        r'<section class="company"[^>]*>\s*<h2>(.*?)</h2>\s*'
        r'<p class="dates">(.*?)</p>\s*<p>(.*?)</p>\s*</section>(.*?)'
        r'(?=<section class="company"|</main>)',
        index,
        re.S,
    )
    if not sections:
        sys.exit("generate-llms: could not find company sections in index.html")
    for name, dates, blurb, tail in sections:
        detail = ""
        note = re.search(r'<p class="(?:note|notable)"[^>]*>(.*?)</p>', tail, re.S)
        if note:
            detail = collapse(strip_tags(note.group(1)))
            detail = re.sub(r"^Notable projects:\s*", "Notable projects: ", detail)
        entry = f"- {collapse(strip_tags(name))} ({collapse(strip_tags(dates))}): {collapse(strip_tags(blurb))}"
        if detail:
            entry += f" {detail}"
        experience.append(entry)

    case_lines = "\n".join(
        f"- [{title}]({url}): {blurb}" for title, url, blurb in cases
    )
    experience_lines = "\n".join(experience)

    bio_block = f"\n{bio}\n" if bio else ""
    out = f"""# Dekel Hillel

> {summary} Portfolio: {BASE_URL}
{bio_block}
## Case Studies

{case_lines}

## Experience

{experience_lines}

## Contact

- [Email](mailto:h.dekel@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/dekelhillel/)
- [CV]({BASE_URL}/cv.pdf)
"""

    target = ROOT / "llms.txt"
    if target.exists() and target.read_text(encoding="utf-8") == out:
        print("llms.txt is up to date")
    else:
        target.write_text(out, encoding="utf-8")
        print("llms.txt regenerated")


if __name__ == "__main__":
    main()
