"""Wipe leftover date/value ghosts from blank LR template."""
from pathlib import Path

import fitz
from PIL import Image, ImageDraw

PDF = Path(
    r"c:\Users\jiten\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\7aabe5b7eb2aec4598b583b3c3e28e98\pdfs"
    r"\5f7719fc-09a3-41d1-a904-cd148a0e2332\384.pdf"
)
OUT = Path(r"e:\log_p\public\brand\lr-form-blank.png")
REF = Path(r"e:\log_p\public\brand\lr-form-reference.png")

# Absolute wipe boxes in PDF points (value areas only — keep labels)
# (x0, y0, x1, y1) — copy1 and copy2
VALUE_BOXES = [
    # Cons.Note No. value
    (478, 88, 560, 103),
    (477, 515, 560, 530),
    # Date value
    (475, 106, 560, 122),
    (474, 533, 560, 549),
    # Valid Date value
    (270, 345, 340, 360),
    (270, 771, 340, 786),
    # Lorry no value
    (65, 63, 160, 78),
    (64, 488, 160, 505),
    # Booking / delivery / from / to values (safe pads)
    (95, 88, 200, 103),
    (94, 515, 200, 530),
    (310, 88, 400, 103),
    (309, 515, 400, 530),
    (95, 106, 200, 122),
    (94, 533, 200, 549),
    (275, 106, 370, 122),
    (274, 533, 370, 549),
]


def main() -> None:
    doc = fitz.open(PDF)
    page = doc[0]
    pw, ph = page.rect.width, page.rect.height

    zoom = 300 / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    # Start from current blank if exists else fresh render
    if OUT.exists():
        im = Image.open(OUT).convert("RGB")
    else:
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    draw = ImageDraw.Draw(im)
    sx, sy = pix.width / pw, pix.height / ph

    for x0, y0, x1, y1 in VALUE_BOXES:
        draw.rectangle([x0 * sx, y0 * sy, x1 * sx, y1 * sy], fill="white")

    im.save(OUT, optimize=True)
    print("wiped value boxes ->", OUT)

    # QA
    im.crop((int(400 * sx), int(85 * sy), int(575 * sx), int(125 * sy))).save(
        Path(r"e:\log_p\public\brand\_qa-date-clean.png")
    )
    im.crop((int(15 * sx), int(365 * sy), int(160 * sx), int(390 * sy))).save(
        Path(r"e:\log_p\public\brand\_qa-pay-clean.png")
    )


if __name__ == "__main__":
    main()
