"use client";

import {
  Upload,
  FileText,
  Table,
  X,
  Brain,
  AlertCircle,
  CheckCircle2,
  Info,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractFileText } from "@/lib/file-parsers";
import { AppLayout } from "@/components/AppLayout";

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  type: "pdf" | "csv" | "xlsx";
  status: "validating" | "valid" | "error";
  rows?: number;
  errorMsg?: string;
  rawFile: File;
  extractedText?: string;
}

const ACCEPTED_TYPES: Record<string, "pdf" | "csv" | "xlsx"> = {
  "application/pdf": "pdf",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xlsx",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function Applicants() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [idCounter, setIdCounter] = useState(1);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningProgress, setScreeningProgress] = useState("");

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const mimeType = ACCEPTED_TYPES[file.type];
      const extType =
        ext === "pdf" ? "pdf" : ext === "csv" ? "csv" : ext === "xlsx" || ext === "xls" ? "xlsx" : null;
      const type = mimeType || extType;

      if (!type) {
        toast.error('"' + file.name + '" is not supported. Use PDF, CSV, or XLSX.');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error('"' + file.name + '" exceeds the 25MB limit.');
        return;
      }

      const id = idCounter;
      setIdCounter((c) => c + 1);

      const entry: UploadedFile = {
        id,
        name: file.name,
        size: formatFileSize(file.size),
        type,
        status: "validating",
        rawFile: file,
      };
      setFiles((prev) => [...prev, entry]);

      // Extract text and validate
      extractFileText(file, type)
        .then((text) => {
          if (!text || text.trim().length < 10) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === id
                  ? {
                      ...f,
                      status: "error" as const,
                      errorMsg:
                        type === "pdf"
                          ? "Could not extract text from this PDF (may be scanned image)"
                          : "File appears empty or missing required columns",
                    }
                  : f
              )
            );
          } else {
            // For XLSX/CSV: our extractor emits exactly one line per candidate (no header line)
            const candidateCount = text.split("\n").filter((l) => l.trim()).length;
            setFiles((prev) =>
              prev.map((f) =>
                f.id === id
                  ? {
                      ...f,
                      status: "valid" as const,
                      extractedText: text,
                      rows: type !== "pdf" ? candidateCount : undefined,
                    }
                  : f
              )
            );
          }
        })
        .catch(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? {
                    ...f,
                    status: "error" as const,
                    errorMsg: "Failed to read file. Please try again.",
                  }
                : f
            )
          );
        });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const handleBrowse = () => fileInputRef.current?.click();
  const removeFile = (id: number) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const validFiles = files.filter((f) => f.status === "valid");
  const validCount = validFiles.length;
  const hasErrors = files.some((f) => f.status === "error");
  const isValidating = files.some((f) => f.status === "validating");

  const fileIcon = (type: string) => {
    if (type === "pdf") return <FileText className="w-5 h-5 text-destructive" />;
    if (type === "xlsx") return <FileSpreadsheet className="w-5 h-5 text-success" />;
    return <Table className="w-5 h-5 text-primary" />;
  };

  const handleRunScreening = async () => {
    if (validCount === 0) return;
    setIsScreening(true);

    try {
      // Combine all extracted text from valid files
      const sections: string[] = [];

      for (const f of validFiles) {
        setScreeningProgress("Reading " + f.name + "...");
        const label =
          f.type === "pdf"
            ? "=== RESUME: " + f.name + " ===\n"
            : "=== SPREADSHEET: " + f.name + " ===\n";
        sections.push(label + (f.extractedText || ""));
      }

      const combinedText = sections.join("\n\n");

      // Store in sessionStorage for results page
      sessionStorage.setItem("applicants_text", combinedText);
      sessionStorage.setItem("applicants_count", validFiles.length.toString());
      sessionStorage.setItem(
        "file_names",
        validFiles.map((f) => f.name).join(", ")
      );

      setScreeningProgress("Starting AI analysis...");
      router.push("/results");
    } catch {
      toast.error("Failed to prepare files for screening.");
      setIsScreening(false);
      setScreeningProgress("");
    }
  };

  return (
    <AppLayout>
    <div className="page-container space-y-6">
      <div>
        <h1 className="page-title">Upload Applicants</h1>
        <p className="page-subtitle">Import candidate data for AI-powered screening</p>
      </div>

      {/* Format Guide */}
      <div className="glass-card p-5 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-foreground">Accepted File Formats</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Table className="w-4 h-4 text-primary" /> CSV Files
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Must include columns:{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">name</code>,{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">email</code>.
                  Optional:{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">skills</code>,{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">experience_years</code>
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-success" /> Excel (XLSX)
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Same structure as CSV. First row must be headers. One candidate per row.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-destructive" /> PDF Resumes
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Individual resume/CV files. AI will extract name, skills, and experience automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          "glass-card border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer",
          dragActive
            ? "border-primary bg-accent/60 scale-[1.01]"
            : "border-border hover:border-primary/40"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={handleBrowse}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={(e) => processFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6 text-accent-foreground" />
        </div>
        <p className="text-foreground font-semibold text-base">
          {dragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or{" "}
          <span className="text-primary font-medium cursor-pointer">browse</span> to select files
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          CSV, XLSX, and PDF files up to 25MB each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">
              Uploaded Files ({files.length})
              {validCount > 0 && (
                <span className="ml-2 text-xs font-normal text-success">· {validCount} ready</span>
              )}
              {isValidating && (
                <span className="ml-2 text-xs font-normal text-primary">· reading files...</span>
              )}
            </h3>
            {hasErrors && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Some files have issues
              </span>
            )}
          </div>
          <div className="divide-y">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center justify-between px-4 py-3 transition-colors",
                  file.status === "error" && "bg-destructive/5"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {fileIcon(file.type)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{file.size}</span>
                      {file.status === "validating" && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Reading...
                        </span>
                      )}
                      {file.status === "valid" && (
                        <span className="text-xs text-success flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready
                          {file.rows ? " · " + file.rows + " candidates" : ""}
                        </span>
                      )}
                      {file.status === "error" && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {file.errorMsg}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {validCount > 0
              ? validCount + " file" + (validCount > 1 ? "s" : "") + " ready for screening"
              : "Upload files to get started"}
          </p>
          {isScreening && screeningProgress && (
            <p className="text-xs text-primary mt-0.5">{screeningProgress}</p>
          )}
        </div>
        <Button
          size="lg"
          className="gap-2 rounded-xl px-6 shrink-0"
          disabled={validCount === 0 || isScreening || isValidating}
          onClick={handleRunScreening}
        >
          {isScreening ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          {isScreening ? "Preparing..." : "Run AI Screening"}
        </Button>
      </div>
    </div>
    </AppLayout>
  );
}
