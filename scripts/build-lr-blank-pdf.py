"""Create blank LR PDF by redacting sample values from 384.pdf (keep all lines)."""
from pathlib import Path
import fitz

SRC = Path(
    r"c:\Users\jiten\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\7aabe5b7eb2aec4598b583b3c3e28e98\pdfs"
    r"\5f7719fc-09a3-41d1-a904-cd148a0e2332\384.pdf"
)
OUT = Path(r"e:\log_p\public\brand\lr-form-blank.pdf")

ERASE = {
    "DD01AA9862",
    "Sangli",
    "DOOR DLY CC ATT",
    "384",
    "shirwal",
    "SURAT",
    "06-08-2026",
    "KIRLOSKAR BROTHERS LTD",
    "KIRLOSKARWADI TAL.PALUS SANGLI MH 416308",
    "27AAACK7300E1ZZ",
    "Shanbhag Engineering Company",
    "PANVEL",
    "27AABFS6095A1ZA",
    "05",
    "PUMPS",
    "2603000474",
    "FIX",
    "7000",
    "212259620838",
    "08-08-2026",
}


def main() -> None:
    doc = fitz.open(SRC)
    page = doc[0]
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b.get("lines", []):
            for s in line.get("spans", []):
                t = s["text"].strip()
                if t not in ERASE:
                    continue
                r = fitz.Rect(s["bbox"])
                if r.x0 > 505:
                    continue
                # pad slightly
                r.x0 -= 1
                r.y0 -= 0.5
                r.x1 += 1
                r.y1 += 0.5
                page.add_redact_annot(r, fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT, garbage=4, deflate=True)
    print("saved", OUT, doc[0].rect)


if __name__ == "__main__":
    main()
