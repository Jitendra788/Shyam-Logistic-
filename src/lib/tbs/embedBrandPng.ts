import type { PDFDocument, PDFImage } from "pdf-lib";

/** Load a /brand PNG on the server (disk) or in the browser (fetch). Never throw. */
export async function embedBrandPng(
  pdf: PDFDocument,
  fileName: string,
): Promise<PDFImage | null> {
  try {
    const bytes = await readBrandPng(fileName);
    if (!bytes?.length) return null;
    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

async function readBrandPng(fileName: string): Promise<Uint8Array | null> {
  if (typeof window !== "undefined") {
    const res = await fetch(`/brand/${fileName}`);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  }
  const { readFile } = await import("fs/promises");
  const path = await import("path");
  const files = [
    path.join(process.cwd(), "public", "brand", fileName),
    path.join(process.cwd(), "src", "lib", "tbs", "assets", fileName),
  ];
  for (const file of files) {
    try {
      return await readFile(file);
    } catch {
      /* try next */
    }
  }
  return null;
}
