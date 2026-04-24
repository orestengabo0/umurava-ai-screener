import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface CandidateData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeLink?: string;
}

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

export async function extractCsvData(file: File): Promise<CandidateData[]> {
  const text = await file.text();
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (!result.data.length) return [];

  const mapped = result.data.map((row) => ({
    firstName: row.firstname || row.firstName || row.Firstname || row.FirstName || "",
    lastName: row.lastname || row.lastName || row.Lastname || row.LastName || "",
    email: row.email || row.Email || "",
    phone: row.phone || row.Phone || row.mobile || row.Mobile || undefined,
    resumeLink: row.resume || row.resumeLink || row.resume_link || row.cv || row.cvLink || row.cv_link || "",
  }));

  const valid = mapped.filter(c => c.firstName && c.lastName && c.email && c.resumeLink);
  return valid as CandidateData[];
}

export async function extractCsvText(file: File): Promise<string> {
  const data = await extractCsvData(file);
  return data.map((row, i) => {
    const fields = Object.entries(row)
      .filter(([, v]) => v && v.toString().trim())
      .map(([k, v]) => k + ": " + v)
      .join(", ");
    return "Candidate " + (i + 1) + " — " + fields;
  }).join("\n");
}

// ── XLSX ─────────────────────────────────────────────────────────────────────
// Uses SheetJS (xlsx) for correct binary parsing — NOT plain text read

export async function extractXlsxData(file: File): Promise<CandidateData[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // Take first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });

  if (!rows.length) return [];

  const mapped = rows.map((row) => ({
    firstName: row.firstname || row.firstName || row.Firstname || row.FirstName || "",
    lastName: row.lastname || row.lastName || row.Lastname || row.LastName || "",
    email: row.email || row.Email || "",
    phone: row.phone || row.Phone || row.mobile || row.Mobile || undefined,
    resumeLink: row.resume || row.resumeLink || row.resume_link || row.cv || row.cvLink || row.cv_link || "",
  }));

  const valid = mapped.filter(c => c.firstName && c.lastName && c.email && c.resumeLink);
  return valid as CandidateData[];
}

export async function extractXlsxText(file: File): Promise<string> {
  const data = await extractXlsxData(file);
  return data.map((row, i) => {
    const fields = Object.entries(row)
      .filter(([, v]) => v && v.toString().trim())
      .map(([k, v]) => k + ": " + v)
      .join(", ");
    return "Candidate " + (i + 1) + " — " + fields;
  }).join("\n");
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

export async function extractCandidateData(
  file: File,
  type: "csv" | "xlsx"
): Promise<CandidateData[]> {
  if (type === "csv") return extractCsvData(file);
  return extractXlsxData(file);
}
