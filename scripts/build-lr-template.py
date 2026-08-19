"""Build blank LR form template + emit field coordinates from reference PDF."""
from __future__ import annotations

import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw

PDF = Path(
    r"c:\Users\jiten\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\7aabe5b7eb2aec4598b583b3c3e28e98\pdfs"
    r"\5f7719fc-09a3-41d1-a904-cd148a0e2332\384.pdf"
)
OUT_DIR = Path(r"e:\log_p\public\brand")

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

# Field anchors from PDF text positions (points). Copy-1 only.
FIELDS_PT = {
    "lorryNo": (70.8, 66.7),
    "bookingFrom": (100.2, 91.3),
    "deliveryAt": (316.2, 91.3),
    "lrNo": (484.2, 91.3),
    "from": (100.8, 109.7),
    "to": (285.9, 109.7),
    "date": (483.6, 109.7),
    "consignor": (76.0, 131.2),
    "consignorAddr": (26.4, 146.5),
    "consignorGst": (76.0, 173.2),
    "consignee": (352.0, 131.2),
    "consigneeAddr": (304.0, 149.2),
    "consigneeGst": (352.0, 173.2),
    "articles": (25.0, 217.1),
    "particulars": (69.9, 217.1),
    "invNo": (268.0, 217.1),
    "rate": (348.8, 217.0),
    "actWt": (333.0, 265.1),
    "chgWt": (334.0, 307.1),
    # freight amounts — right edge of Freight column (~515)
    "freight": (508.0, 216.0),
    "doorColl": (508.0, 231.0),
    "doorDel": (508.0, 246.0),
    "hamali": (508.0, 261.0),
    "stChgs": (508.0, 274.0),
    "totalAmt": (508.0, 289.0),
    "gstAmt": (508.0, 303.0),
    "advance": (508.0, 316.9),
    "balance": (508.0, 332.1),
    "eway": (86.0, 348.1),
    "validDate": (278.0, 348.1),
    # payment ticks (checkbox centers approx)
    "payTopay": (28.0, 374.1),
    "payPaid": (76.0, 374.1),
    "payTbb": (117.0, 374.1),
    # GST pay ticks top-right
    "gstConsigner": (430.0, 78.0),
    "gstConsignee": (490.0, 78.0),
    "gstTransporter": (545.0, 78.0),
}

COPY2_DY = 419.8  # pts


def main() -> None:
    doc = fitz.open(PDF)
    page = doc[0]
    pw, ph = page.rect.width, page.rect.height

    rects: list[fitz.Rect] = []
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b.get("lines", []):
            for s in line.get("spans", []):
                t = s["text"].strip()
                if t in ERASE:
                    rects.append(fitz.Rect(s["bbox"]))

    zoom = 300 / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    draw = ImageDraw.Draw(im)
    sx, sy = pix.width / pw, pix.height / ph

    for r in rects:
        box = [
            r.x0 * sx - 3,
            r.y0 * sy - 2,
            r.x1 * sx + 4,
            r.y1 * sy + 2,
        ]
        draw.rectangle(box, fill="white")

    # Wipe freight amount columns (both copies)
    for y0, y1 in [(210, 340), (635, 765)]:
        draw.rectangle([448 * sx, y0 * sy, 518 * sx, y1 * sy], fill="white")

    blank = OUT_DIR / "lr-form-blank.png"
    im.save(blank, optimize=True)
    print("blank", blank, im.size)

    filled = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    filled.save(OUT_DIR / "lr-form-reference.png", optimize=True)

    fields_pct = {}
    for k, (x, y) in FIELDS_PT.items():
        fields_pct[k] = {
            "left": round(x / pw * 100, 3),
            "top": round(y / ph * 100, 3),
        }

    meta = {
        "pagePts": [pw, ph],
        "copy2OffsetPct": round(COPY2_DY / ph * 100, 4),
        "fields": fields_pct,
    }
    meta_path = OUT_DIR / "lr-form-fields.json"
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print("meta", meta_path)
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
