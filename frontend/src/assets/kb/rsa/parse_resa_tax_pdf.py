#!/usr/bin/env python3
"""
ReSA Taxation final pre-board seeder parser.

Input:  pdftotext -layout output at /tmp/resa_tax.txt
Output: frontend/src/assets/kb/rsa/ReSA_Tax_Final.json

This script is a copy of the in-repo parser kept under
frontend/src/assets/kb/rsa/parse_resa_tax_pdf.py so it can be re-run
independently when the PDF text file changes.
"""

import json
import refrom pathlib import Path

BASE = Path(__file__).resolve().parent.parent.parent
SRC = Path("/tmp/resa_tax.txt")
OUT = BASE / "frontend" / "src" / "assets" / "kb" / "rsa" / "ReSA_Tax_Final.json"


def parse_answer_key(block: str) -> dict[int, str]:
    mapping: dict[int, str] = {}
    flat = re.sub(r"[ \t]+", " ", block)
    tokens = flat.split()
    i = 0
    while i + 1 < len(tokens):
        try:
            num = int(tokens[i])
            letter = tokens[i + 1].upper()
            if letter in ("A", "B", "C", "D"):
                mapping[num] = letter
                i += 2
                continue
        except ValueError:
            pass
        i += 1
    return mapping


PAGE_HDR_RE = re.compile(
    r"^\s*(Page \d+ of \d+|TAXATION|ReSA Batch 51|FINAL PRE-BOARD EXAM|"
    r"0915-2303213|resacpareview@gmail.com|END of EXAMINATION)\s*$"
)
FINAL_EXAM_RE = re.compile(r"^\s*-\s*END of EXAMINATION\s*-\s*$")
SOLUTION_START_RE = re.compile(r"^\s*ANSWERS & SOLUTIONS/CLARIFICATIONS\s*$")


def normalize_prompt(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"[,;\.]\s*$", "", s)
    return s


def partition_items(lines: list[str]) -> list[tuple[int, str, list[str]]]:
    items: list[tuple[int, str, list[str]]] = []
    cur_no: int | None = None
    cur_prompt: list[str] = []
    cur_choices: list[str] = []
    in_prompt = True

    for raw in lines:
        stripped = raw.strip()
        if PAGE_HDR_RE.match(stripped):
            continue
        if SOLUTION_START_RE.match(stripped):
            continue
        if FINAL_EXAM_RE.match(stripped):
            if cur_no is not None and cur_prompt:
                items.append((cur_no, normalize_prompt(" ".join(cur_prompt)), cur_choices[:4]))
            break
        if stripped.startswith("INSTRUCTIONS:"):
            continue

        m = re.match(r"^(?P<no>[0-9]{1,2})\.\s*(?P<rest>.*)$", stripped)
        if m:
            if cur_no is not None and cur_prompt:
                items.append((cur_no, normalize_prompt(" ".join(cur_prompt)), cur_choices[:4]))
            cur_no = int(m.group("no"))
            rest = m.group("rest").strip()
            cur_prompt = [rest] if rest else []
            cur_choices = []
            in_prompt = True if rest else False
            continue

        cm = re.match(r"^\s*(?P<marker>[a-dA-D])[.)\s]\s*(?P<text>.*)$", stripped)
        if cm:
            marker = cm.group("marker").lower()
            t = re.sub(r"\s+", " ", cm.group("text")).strip()
            if not t:
                continue
            if in_prompt and not cur_choices:
                in_prompt = False
            idx = ord(marker) - ord("a")
            while len(cur_choices) <= idx:
                cur_choices.append("")
            cur_choices[idx] = t
            continue

        if in_prompt and stripped:
            cur_prompt.append(stripped)
        elif not in_prompt and cur_choices:
            continue
        if cur_no is None:
            continue

    if cur_no is not None and cur_prompt:
        items.append((cur_no, normalize_prompt(" ".join(cur_prompt)), cur_choices[:4]))
    return items


def extract_solutions(text: str) -> dict[int, str]:
    start = text.find("ANSWERS & SOLUTIONS")
    if start == -1:
        return {}
    body = text[start:]
    out: dict[int, str] = {}
    for m in re.finditer(r"\n\s*(?P<num>[0-9]{1,2})\.\s*(?P<letter>[A-D])\s*\n", body):
        num = int(m.group("num"))
        letter = m.group("letter").upper()
        if letter not in ("A", "B", "C", "D"):
            continue
        start_idx = m.end()
        nxt = re.search(r"\n\s*(?P<n>[0-9]{1,2})\.\s*[A-D]\s*\n", body[start_idx:])
        chunk = body[start_idx : start_idx + nxt.start()] if nxt else body[start_idx:]
        chunk = chunk.strip("\n").strip()
        chunk = re.split(r"Page \d+ of \d+", chunk)[0].strip()
        if chunk:
            out[num] = normalize_prompt(chunk)
    return out


def main() -> None:
    text = SRC.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    answers_start = text.find("ANSWERS & SOLUTIONS")
    answer_block = ""
    if answers_start != -1:
        region = text[answers_start:]
        m = re.search(r"\n\s*(?P<num>[0-9]{1,2})\.\s*(?P<letter>[A-D])\s*\n", region)
        if m:
            answer_block = region[:m.start()]
        else:
            answer_block = region[:1500]
    answer_key = parse_answer_key(answer_block) if answer_block else {}
    solutions = extract_solutions(text)

    items = partition_items(lines)
    print("headers", len(items), "answer_key", len(answer_key))

    seed: list[dict] = []
    seq = 1
    for item_no, prompt, choices in items:
        cleaned = []
        for i, ch in enumerate(choices):
            t = ch.strip()
            if not t:
                t = f"Choice {chr(ord('A')+i)} not extracted from table."
            cleaned.append({"id": chr(ord('a')+i), "text": t})
        while len(cleaned) < 4:
            cleaned.append({"id": chr(ord('a')+len(cleaned)),
                            "text": "Choice not extracted from table."})
        correct = answer_key.get(item_no, "a").lower()
        rationale = solutions.get(item_no, "")
        if len(rationale) > 1000:
            rationale = rationale[:1000].rstrip() + "..."
        seed.append({
            "id": f"rsa-tax-b51-{seq:03d}",
            "prompt": prompt,
            "choices": cleaned,
            "correctChoiceId": correct,
            "rationale": rationale.strip(),
            "source": {
                "center": "ReSA - The Review School of Accountancy",
                "batch": "Batch 51 - May 2026 CPALE",
                "examType": "Final Pre-Board Examination",
            },
            "tos": {
                "subject": "TAXATION",
                "topicCategory": "Taxation",
                "subTopic": "General Taxation",
                "tosCode": "TAX.A.1",
                "cognitiveLevel": "Remembering",
                "difficulty": "Easy",
            },
            "canonicalConcept": f"ReSA Batch 51 May 2026 Taxation item {item_no}",
        })
        seq += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(seed, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Wrote", OUT, "items", len(seed),
          "with rationale", sum(1 for x in seed if x["rationale"].strip()))


if __name__ == "__main__":
    main()
