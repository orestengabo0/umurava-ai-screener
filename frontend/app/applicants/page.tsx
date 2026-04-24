"use client";

import {
  Upload,
  FileText,
  X,
  Brain,
  Info,
  FileSpreadsheet,
  Loader2,
  Target,
  FileSearch,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractFileText } from "@/lib/file-parsers";
import { AppLayout } from "@/components/AppLayout";
import { getJobs, type Job } from "@/lib/api/jobs";
import { Badge } from "@/components/ui/badge";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "csv" | "xlsx";
  status: "validating" | "valid" | "processing" | "processed" | "error";
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

function ApplicantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningProgress, setScreeningProgress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

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

      const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

      const entry: UploadedFile = {
        id,
        name: file.name,
        size: formatFileSize(file.size),
        type,
        status: "validating",
        rawFile: file,
      };
      setFiles((prev) => [...prev, entry]);

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
                          ? "Scanned PDF detected. Text extraction failed."
                          : "File appears empty.",
                    }
                  : f
              )
            );
          } else {
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
              f.id === id ? { ...f, status: "error", errorMsg: "Read failure." } : f
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

  useEffect(() => {
    setJobsLoading(true);
    getJobs({ status: "open" })
      .then((res) => {
        setJobs(res.jobs);
        if (initialJobId) {
          setSelectedJobId(initialJobId);
        } else if (!selectedJobId && res.jobs.length > 0) {
          setSelectedJobId(res.jobs[0]._id);
        }
      })
      .finally(() => setJobsLoading(false));
  }, [initialJobId]);

  const handleRunScreening = async () => {
    if (!selectedJobId) return;
    setIsScreening(true);
    router.push(`/jobs/${selectedJobId}/results`);
  };

  const handleProcessToJob = async () => {
    const validFiles = files.filter(f => f.status === "valid");
    if (validFiles.length === 0 || !selectedJobId) return;

    setIsProcessing(true);
    setProgressPercentage(0);

    setFiles((prev) =>
      prev.map((f) => (f.status === "valid" ? { ...f, status: "processing" } : f))
    );

    const baseRaw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    const base = baseRaw.endsWith("/api") ? baseRaw.slice(0, -4) : baseRaw;

    let processedCount = 0;
    for (const f of validFiles) {
      setScreeningProgress(`Analyzing ${f.name}...`);
      try {
        const form = new FormData();
        form.append("files", f.rawFile, f.rawFile.name);
        const res = await fetch(`${base}/api/jobs/${selectedJobId}/resumes/process`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        
        setFiles((prev) =>
          prev.map((file) => {
            if (file.id !== f.id) return file;
            if (data?.results?.[0]?.ok) return { ...file, status: "processed" as const };
            return { ...file, status: "error" as const, errorMsg: data?.results?.[0]?.reason || "Failed" };
          })
        );
      } catch (e) {
        setFiles((prev) =>
          prev.map((file) => (file.id === f.id ? { ...file, status: "error", errorMsg: "Upload failed" } : file))
        );
      }
      processedCount++;
      setProgressPercentage(Math.round((processedCount / validFiles.length) * 100));
    }
    setScreeningProgress("");
    setIsProcessing(false);
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Talent Ingestion</h1>
        <p className="text-muted-foreground mt-0.5 text-[10px] font-bold uppercase tracking-wider">
          Batch process resumes with AI Intelligence
        </p>
      </div>

      <div
        className={cn(
          "bg-card border-2 border-dashed rounded-md p-10 text-center transition-all group cursor-pointer relative overflow-hidden",
          dragActive ? "border-primary bg-primary/5" : "border-accent hover:border-primary/40"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" className="hidden" multiple accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => processFiles(e.target.files)} />
        
        <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mx-auto mb-3 transition-transform">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-foreground tracking-tight uppercase tracking-wider">Inhale Resumes</h3>
        <p className="text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-widest opacity-60">PDF, CSV or XLSX (Max 25MB)</p>
        <div className="mt-4 flex justify-center gap-1.5">
          {["PDF", "CSV", "XLSX"].map(t => (
            <Badge key={t} variant="outline" className="bg-white/50 px-1.5 py-0 rounded-sm font-bold border-accent/40 text-muted-foreground text-[8px]">{t}</Badge>
          ))}
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-card border rounded-md overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b flex items-center justify-between bg-accent/10">
            <h3 className="font-bold text-[10px] text-foreground flex items-center gap-2 uppercase tracking-widest">
              <FileSearch className="w-3.5 h-3.5 text-primary" />
              Queue ({files.length})
            </h3>
            {screeningProgress && <p className="text-[9px] font-bold text-primary animate-pulse uppercase tracking-wider">{screeningProgress}</p>}
          </div>
          <div className="divide-y max-h-[240px] overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center border",
                    file.type === "pdf" ? "bg-red-50/50 border-red-100 text-red-500" : "bg-blue-50/50 border-blue-100 text-blue-500"
                  )}>
                    {file.type === "pdf" ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-[11px] truncate max-w-[200px]">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">{file.size}</span>
                      {file.status === "validating" && <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />}
                      {file.status === "valid" && <Badge className="bg-blue-600/10 text-blue-600 text-[7px] font-bold uppercase rounded-sm px-1 py-0 border-none">Ready</Badge>}
                      {file.status === "processed" && <Badge className="bg-blue-600/10 text-blue-600 text-[7px] font-bold uppercase rounded-sm px-1 py-0 border-none">Analyzed</Badge>}
                      {file.status === "error" && <Badge variant="destructive" className="text-[7px] font-bold uppercase rounded-sm px-1 py-0">{file.errorMsg}</Badge>}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-md h-7 w-7 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(f => f.id !== file.id)); }}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
           <Info className="w-3.5 h-3.5 text-primary" />
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI processes files in real-time.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none rounded-md h-9 px-4 font-bold text-[11px] uppercase tracking-wider relative overflow-hidden"
            disabled={!files.some(f => f.status === "valid") || isProcessing || isScreening}
            onClick={handleProcessToJob}
          >
            {isProcessing && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isProcessing ? `Processing... ${progressPercentage}%` : "Start Analysis"}
            </span>
          </Button>
          <Button
            className="flex-1 sm:flex-none rounded-md h-9 px-5 font-bold text-[11px] uppercase tracking-wider group"
            disabled={!files.some(f => f.status === "processed") || isProcessing || isScreening}
            onClick={handleRunScreening}
          >
            Open Results
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Applicants() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
        </div>
      }>
        <ApplicantsContent />
      </Suspense>
    </AppLayout>
  );
}
