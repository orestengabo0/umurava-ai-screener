import Papa from "papaparse";
import * as XLSX from "xlsx";

// ── PDF ─────────────────────────────────────────────────────────────────────

export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Use local worker file copied to /public — avoids CDN 404s
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText.trim());
  }

  return pages.filter(Boolean).join("\n").trim();
}

// ── CSV ──────────────────────────────────────────────────────────────────────

export async function extractCsvText(file: File): Promise<string> {
  const text = await file.text();
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (!result.data.length) return "";

  const rows = result.data.map((row, i) => {
    const fields = Object.entries(row)
      .filter(([, v]) => v && v.toString().trim())
      .map(([k, v]) => k + ": " + v)
      .join(", ");
    return "Candidate " + (i + 1) + " — " + fields;
  });

  return rows.join("\n");
}

// ── XLSX ─────────────────────────────────────────────────────────────────────
// Uses SheetJS (xlsx) for correct binary parsing — NOT plain text read

export async function extractXlsxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // Take first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return "";

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });

  if (!rows.length) return "";

  const lines = rows.map((row, i) => {
    const fields = Object.entries(row)
      .filter(([, v]) => v && v.toString().trim())
      .map(([k, v]) => k + ": " + v)
      .join(", ");
    return "Candidate " + (i + 1) + " — " + fields;
  });

  return lines.join("\n");
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export async function extractFileText(
  file: File,
  type: "pdf" | "csv" | "xlsx"
): Promise<string> {
  if (type === "pdf") return extractPdfText(file);
  if (type === "csv") return extractCsvText(file);
  return extractXlsxText(file);
}
