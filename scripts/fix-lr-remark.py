"""Rebuild blank LR template without destroying Freight/Remark grid lines."""
from pathlib import Path

import fitz
from PIL import Image, ImageDraw

PDF = Path(
    r"c:\Users\jiten\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\7aabe5b7eb2aec4598b583b3c3e28e98\pdfs"
    r"\5f7719fc-09a3-41d1-a904-cd148a0e2332\384.pdf"
)
OUT = Path(r"e:\log_p\public\brand")

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
    doc = fitz.open(PDF)
    page = doc[0]
    pw = page.rect.width

    zoom = 300 / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    filled = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    blank = filled.copy()
    draw = ImageDraw.Draw(blank)
    sx, sy = pix.width / pw, pix.height / page.rect.height

    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b.get("lines", []):
            for s in line.get("spans", []):
                t = s["text"].strip()
                if t not in ERASE:
                    continue
                r = fitz.Rect(s["bbox"])
                # Keep clear of Remark column (divider ~507.8)
                x1 = min(r.x1, 505.0)
                if r.x0 >= 505:
                    continue
                draw.rectangle(
                    [r.x0 * sx - 2, r.y0 * sy - 1, x1 * sx + 3, r.y1 * sy + 1],
                    fill="white",
                )

    # Restore full Freight Ch + Freight + Remark grid from original (both copies)
    # so any accidental wipe on grid lines is undone
    for y0, y1 in [(195, 345), (618, 770)]:
        box = (int(380 * sx), int(y0 * sy), int(588 * sx), int(y1 * sy))
        blank.paste(filled.crop(box), box[:2])
        print("restored grid", box)

    out = OUT / "lr-form-blank.png"
    blank.save(out, optimize=True)
    print("saved", out)

    blank.crop((int(380 * sx), int(195 * sy), int(588 * sx), int(345 * sy))).save(
        OUT / "_qa-fr-rem-fixed.png"
    )


if __name__ == "__main__":
    main()
