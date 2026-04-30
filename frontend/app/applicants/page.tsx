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
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractFileText, extractCandidateData, type CandidateData } from "@/lib/file-parsers";
import { AppLayout } from "@/components/AppLayout";
import { getJobs, type Job } from "@/lib/api/jobs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getToken } from "@/lib/api/auth";

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
  candidateData?: CandidateData[];
  processingResults?: {
    downloaded: string[];
    downloadFailed: Array<{ email: string; error: string }>;
    processed: Array<{ ok: boolean; candidate: string; applicantId?: string }>;
    processFailed: Array<{ ok: boolean; candidate: string; error: string }>;
  };
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

function ApplicantsContent({ setQuotaErrorDialogOpen }: { setQuotaErrorDialogOpen: (open: boolean) => void }) {
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
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  useEffect(() => {
    if (!initialJobId) {
      router.replace("/jobs");
    } else {
      setSelectedJobId(initialJobId);
    }
  }, [initialJobId, router]);

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

      if (type === "csv" || type === "xlsx") {
        // Extract candidate data from CSV/XLSX
        extractCandidateData(file, type)
          .then((data) => {
            console.log(`[Frontend] Extracted ${data.length} candidates from ${file.name}:`, data);
            
            if (!data || data.length === 0) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === id
                    ? {
                        ...f,
                        status: "error" as const,
                        errorMsg: "No valid candidate data found. Required columns: firstname, lastname, email, resumeLink",
                      }
                    : f
                )
              );
            } else {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === id
                    ? {
                        ...f,
                        status: "valid" as const,
                        rows: data.length,
                        candidateData: data,
                        extractedText: JSON.stringify(data),
                      }
                    : f
                )
              );
            }
          })
          .catch(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === id ? { ...f, status: "error", errorMsg: "Failed to parse candidate data" } : f
              )
            );
          });
      } else {
        // Extract text from PDF
        extractFileText(file, type)
          .then((text) => {
            if (!text || text.trim().length < 10) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === id
                    ? {
                        ...f,
                        status: "error" as const,
                        errorMsg: "Scanned PDF detected. Text extraction failed.",
                      }
                    : f
                )
              );
            } else {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === id
                    ? {
                        ...f,
                        status: "valid" as const,
                        extractedText: text,
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
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    if (!initialJobId) return;
    setJobsLoading(true);
    getJobs({ status: "open" })
      .then((res) => setJobs(res.jobs))
      .finally(() => setJobsLoading(false));
  }, [initialJobId]);

  const handleRunScreening = async () => {
    if (!selectedJobId) return;
    setIsScreening(true);
    router.push(`/jobs/${selectedJobId}/results`);
  };

  const toggleFileExpansion = (fileId: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
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

    // Separate CSV/XLSX files from PDF files
    const csvXlsxFiles = validFiles.filter(f => f.type === "csv" || f.type === "xlsx");
    const pdfFiles = validFiles.filter(f => f.type === "pdf");

    let processedCount = 0;
    const totalFiles = validFiles.length;

    // Process CSV/XLSX files with candidate data
    for (const f of csvXlsxFiles) {
      setScreeningProgress(`Processing ${f.name}...`);
      try {
        const token = getToken();
        
        console.log(`[Frontend] Sending ${f.candidateData?.length} candidates from ${f.name} to backend`);
        console.log(`[Frontend] Candidates:`, f.candidateData);
        
        const res = await fetch(`${base}/api/jobs/${selectedJobId}/resumes/process-csv`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            candidates: f.candidateData,
          }),
        });
        const data = await res.json();
        
        console.log(`[Frontend] Backend response for ${f.name}:`, data);
        
        // Check for quota exceeded error in backend response
        if (data.message && (data.message.includes('429') || data.message.includes('quota') || data.message.includes('Too Many Requests'))) {
          setQuotaErrorDialogOpen(true);
        }
        
        // Check for quota errors in processing results
        if (data.results?.processFailed) {
          const hasQuotaError = data.results.processFailed.some((r: any) => 
            r.error && (r.error.includes('429') || r.error.includes('quota') || r.error.includes('Too Many Requests'))
          );
          if (hasQuotaError) {
            setQuotaErrorDialogOpen(true);
          }
        }
        
        setFiles((prev) =>
          prev.map((file) => {
            if (file.id !== f.id) return file;
            if (data.success) {
              return { 
                ...file, 
                status: "processed" as const,
                processingResults: data.results,
              };
            }
            return { 
              ...file, 
              status: "error" as const, 
              errorMsg: data.message || "Failed",
              processingResults: data.results,
            };
          })
        );
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Upload failed';
        
        console.error(`[Frontend] Error processing ${f.name}:`, error);
        
        // Check for quota exceeded error
        if (error.includes('429') || error.includes('quota') || error.includes('Too Many Requests')) {
          setQuotaErrorDialogOpen(true);
        } else {
          toast.error("Processing failed", {
            description: error,
          });
        }
        
        setFiles((prev) =>
          prev.map((file) => (file.id === f.id ? { ...file, status: "error", errorMsg: "Upload failed" } : file))
        );
      }
      processedCount++;
      setProgressPercentage(Math.round((processedCount / totalFiles) * 100));
    }

    // Process PDF files
    for (const f of pdfFiles) {
      setScreeningProgress(`Analyzing ${f.name}...`);
      try {
        const form = new FormData();
        form.append("files", f.rawFile, f.rawFile.name);
        const token = getToken();
        const res = await fetch(`${base}/api/jobs/${selectedJobId}/resumes/process`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });
        const data = await res.json();
        
        // Check for quota exceeded error in backend response
        if (data.message && (data.message.includes('429') || data.message.includes('quota') || data.message.includes('Too Many Requests'))) {
          setQuotaErrorDialogOpen(true);
        }
        
        // Check for quota errors in processing results (for PDF endpoint)
        if (data.results && Array.isArray(data.results)) {
          const hasQuotaError = data.results.some((r: any) => 
            r.reason && (r.reason.includes('429') || r.reason.includes('quota') || r.reason.includes('Too Many Requests'))
          );
          if (hasQuotaError) {
            setQuotaErrorDialogOpen(true);
          }
        }
        
        // Check for quota errors in processing results (for CSV endpoint)
        if (data.results) {
          const allErrors = [...(data.results.processFailed || []), ...(data.results.downloadFailed || [])];
          const hasQuotaError = allErrors.some((r: any) => 
            r.error && (r.error.includes('429') || r.error.includes('quota') || r.error.includes('Too Many Requests'))
          );
          if (hasQuotaError) {
            setQuotaErrorDialogOpen(true);
          }
        }
        
        setFiles((prev) =>
          prev.map((file) => {
            if (file.id !== f.id) return file;
            if (data?.results?.[0]?.ok) {
              return { 
                ...file, 
                status: "processed" as const,
                processingResults: {
                  downloaded: [],
                  downloadFailed: [],
                  processed: [{ ok: true, candidate: file.name }],
                  processFailed: [],
                },
              };
            }
            const errorReason = data?.results?.[0]?.reason || data?.message || "Failed";
            console.log(`[Frontend] PDF processing failed for ${f.name}:`, errorReason);
            return { 
              ...file, 
              status: "error" as const, 
              errorMsg: errorReason,
              processingResults: {
                downloaded: [],
                downloadFailed: [],
                processed: [],
                processFailed: [{ ok: false, candidate: file.name, error: errorReason }],
              },
            };
          })
        );
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Upload failed';
        
        // Check for quota exceeded error
        if (error.includes('429') || error.includes('quota') || error.includes('Too Many Requests')) {
          toast.error("API quota exceeded", {
            description: "Your Gemini API quota has been reached. Please go to Settings and update your API key or switch to a different model.",
            action: {
              label: "Go to Settings",
              onClick: () => router.push('/settings'),
            },
          });
        } else {
          toast.error("Upload failed", {
            description: error,
          });
        }
        
        setFiles((prev) =>
          prev.map((file) => (file.id === f.id ? { 
            ...file, 
            status: "error", 
            errorMsg: "Upload failed",
            processingResults: {
              downloaded: [],
              downloadFailed: [],
              processed: [],
              processFailed: [{ ok: false, candidate: file.name, error: error }],
            },
          } : file))
        );
      }
      processedCount++;
      setProgressPercentage(Math.round((processedCount / totalFiles) * 100));
    }
    setScreeningProgress("");
    setIsProcessing(false);
  };

  if (!initialJobId) {
    return null; // Return nothing while redirecting
  }

  return (
    <Suspense>
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
        <h3 className="text-sm font-bold text-foreground tracking-tight uppercase tracking-wider">Upload Resumes</h3>
        <p className="text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-widest opacity-60">PDF, CSV or XLSX (Max 25MB)</p>
        <div className="mt-4 flex justify-center gap-1.5">
          {["PDF", "CSV", "XLSX"].map(t => (
            <Badge key={t} variant="outline" className="bg-white/50 px-1.5 py-0 rounded-sm font-bold border-accent/40 text-muted-foreground text-[8px]">{t}</Badge>
          ))}
        </div>
      </div>

      {/* CSV/XLSX Format Requirements */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-md p-4">
        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          CSV/XLSX Required Columns
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white rounded px-2 py-1.5 border border-blue-100">
            <p className="text-[9px] font-bold text-foreground">firstname</p>
            <p className="text-[8px] text-muted-foreground">Required</p>
          </div>
          <div className="bg-white rounded px-2 py-1.5 border border-blue-100">
            <p className="text-[9px] font-bold text-foreground">lastname</p>
            <p className="text-[8px] text-muted-foreground">Required</p>
          </div>
          <div className="bg-white rounded px-2 py-1.5 border border-blue-100">
            <p className="text-[9px] font-bold text-foreground">email</p>
            <p className="text-[8px] text-muted-foreground">Required</p>
          </div>
          <div className="bg-white rounded px-2 py-1.5 border border-blue-100">
            <p className="text-[9px] font-bold text-foreground">resumeLink</p>
            <p className="text-[8px] text-muted-foreground">Required</p>
          </div>
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
              <div key={file.id} className="flex flex-col">
                <div 
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => file.status === "processed" && (file.type === "csv" || file.type === "xlsx") && toggleFileExpansion(file.id)}
                >
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
                        {file.status === "error" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="destructive" 
                                  className="text-[7px] font-bold uppercase rounded-sm px-1 py-0 cursor-help"
                                >
                                  {file.errorMsg}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="whitespace-pre-wrap text-xs">
                                  {file.processingResults?.processFailed?.map(f => `${f.candidate}: ${f.error}`).join('\n') || 
                                   file.processingResults?.downloadFailed?.map(f => `${f.email}: ${f.error}`).join('\n') ||
                                   file.errorMsg}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(file.type === "csv" || file.type === "xlsx") && file.status === "processed" && (
                      <Button variant="ghost" size="icon" className="rounded-md h-6 w-6">
                        {expandedFiles.has(file.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="rounded-md h-7 w-7 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(f => f.id !== file.id)); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Processing Results Details */}
                {expandedFiles.has(file.id) && file.processingResults && (
                  <div className="px-4 py-3 bg-accent/30 border-t border-accent/50 space-y-3">
                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-background rounded p-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p>
                        <p className="text-sm font-bold text-foreground">{file.processingResults.downloaded.length + file.processingResults.downloadFailed.length}</p>
                      </div>
                      <div className="bg-background rounded p-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Downloaded</p>
                        <p className="text-sm font-bold text-green-600">{file.processingResults.downloaded.length}</p>
                      </div>
                      <div className="bg-background rounded p-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Processed</p>
                        <p className="text-sm font-bold text-blue-600">{file.processingResults.processed.filter(r => r.ok).length}</p>
                      </div>
                      <div className="bg-background rounded p-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Failed</p>
                        <p className="text-sm font-bold text-red-600">{file.processingResults.downloadFailed.length + file.processingResults.processFailed.length}</p>
                      </div>
                    </div>

                    {/* Download Failures */}
                    {file.processingResults.downloadFailed.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Download Failures ({file.processingResults.downloadFailed.length})
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {file.processingResults.downloadFailed.map((fail, idx) => (
                            <div key={idx} className="bg-background rounded px-2 py-1.5 text-[9px]">
                              <p className="font-semibold text-foreground">{fail.email}</p>
                              <p className="text-muted-foreground truncate">{fail.error}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Processing Failures */}
                    {file.processingResults.processFailed.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Processing Failures ({file.processingResults.processFailed.length})
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {file.processingResults.processFailed.map((fail, idx) => (
                            <div key={idx} className="bg-background rounded px-2 py-1.5 text-[9px]">
                              <p className="font-semibold text-foreground">{fail.candidate}</p>
                              <p className="text-muted-foreground truncate">{fail.error}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
            View Results
          </Button>
        </div>
      </div>
    </div>
    </Suspense>
  );
}

export default function Applicants() {
  const [quotaErrorDialogOpen, setQuotaErrorDialogOpen] = useState(false);
  const router = useRouter();

  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
        </div>
      }>
        <ApplicantsContent setQuotaErrorDialogOpen={setQuotaErrorDialogOpen} />
      </Suspense>
      <Dialog open={quotaErrorDialogOpen} onOpenChange={setQuotaErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">API Quota Exceeded</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Your Gemini API quota has been reached. Please go to Settings and update your API key or switch to a different model.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaErrorDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => router.push('/settings')}>
              Go to Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

