"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  Star,
  ArrowLeft,
  Brain,
  RefreshCw,
  FileText,
} from "lucide-react";
import { MatchScoreBar } from "@/components/MatchScoreBar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

interface Candidate {
  id: number;
  name: string;
  role: string;
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: "Highly Recommended" | "Recommended" | "Consider" | "Not Recommended";
  experience: string;
  skills: string[];
  aiSummary: string;
}

const recStyles: Record<string, string> = {
  "Highly Recommended": "bg-success/10 text-success border-success/20",
  Recommended: "bg-primary/10 text-primary border-primary/20",
  Consider: "bg-warning/10 text-warning border-warning/20",
  "Not Recommended": "bg-destructive/10 text-destructive border-destructive/20",
};

// Fallback job details – ideally pulled from a job creation form in future
const DEFAULT_JOB_DETAILS = `
Position: Software Engineer / Developer
Requirements: Relevant technical skills, professional experience, strong problem-solving ability.
Nice to have: Leadership experience, open source contributions, certifications, strong portfolio.
Evaluate each candidate fairly based on their actual profile data provided.
`;

export default function Results() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileNames, setFileNames] = useState<string>("");
  const [loadingStep, setLoadingStep] = useState("Reading your files...");
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // Pull extracted text from sessionStorage (set by applicants page)
      const applicantsText = sessionStorage.getItem("applicants_text");
      const names = sessionStorage.getItem("file_names") || "";
      setFileNames(names);

      if (!applicantsText || applicantsText.trim().length < 10) {
        setError(
          "No applicant data found. Please go back and upload your files first."
        );
        setLoading(false);
        return;
      }

      try {
        setLoadingStep("Sending data to Gemini AI...");

        const res = await fetch("/api/screen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDetails: DEFAULT_JOB_DETAILS,
            applicantsText,
          }),
        });

        setLoadingStep("Processing AI response...");

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: string }).error || "Screening request failed"
          );
        }

        const data: Candidate[] = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error(
            "AI returned no candidates. Check that your files contain readable candidate data."
          );
        }

        setCandidates(data);

        // Clear sessionStorage after successful load
        sessionStorage.removeItem("applicants_text");
        sessionStorage.removeItem("applicants_count");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const countByRec = (label: string) =>
    candidates.filter((c) => c.recommendation === label).length;

  const stats = [
    {
      label: "Highly Recommended",
      value: countByRec("Highly Recommended"),
      color: "text-success",
    },
    {
      label: "Recommended",
      value: countByRec("Recommended"),
      color: "text-primary",
    },
    {
      label: "Consider",
      value: countByRec("Consider"),
      color: "text-warning",
    },
    {
      label: "Not Recommended",
      value: countByRec("Not Recommended"),
      color: "text-destructive",
    },
  ];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h2 className="text-xl font-bold text-foreground">
            AI is screening candidates...
          </h2>
          <p className="text-muted-foreground text-sm">{loadingStep}</p>
          {fileNames && (
            <p className="text-xs text-muted-foreground">
              Files: {fileNames}
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation: "bounce 1.2s ease-in-out infinite",
                animationDelay: i * 0.15 + "s",
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
      </AppLayout>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <AppLayout>
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <p className="text-foreground font-bold text-lg">Screening Failed</p>
            <p className="text-muted-foreground text-sm mt-1">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </div>
      </AppLayout>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="page-title">AI Screening Results</h1>
          <p className="page-subtitle">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} ranked by Gemini AI
            {fileNames && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs">
                <FileText className="w-3 h-3" />
                {fileNames}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
            <p className={cn("text-2xl font-extrabold mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Candidate List */}
      <div className="space-y-3">
        {candidates.map((c, i) => {
          const key = c.id ?? i;
          const isOpen = expanded === key;
          return (
            <div
              key={key}
              className="glass-card overflow-hidden"
              style={{ animationDelay: i * 60 + "ms" }}
            >
              <button
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isOpen ? null : key)}
              >
                <div className="badge-rank flex-shrink-0">{i + 1}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground">{c.name}</h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs rounded-lg",
                        recStyles[c.recommendation] ??
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.recommendation}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {c.role}
                    {c.experience ? " · " + c.experience : ""}
                  </p>
                </div>

                <div className="w-44 hidden md:block">
                  <MatchScoreBar score={c.score} />
                </div>

                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t space-y-4">
                  {/* Mobile score */}
                  <div className="md:hidden">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Match Score
                    </p>
                    <MatchScoreBar score={c.score} />
                  </div>

                  {/* Skills */}
                  {c.skills?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {c.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.strengths?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-success" />
                          Strengths
                        </p>
                        <ul className="space-y-1.5">
                          {c.strengths.map((s) => (
                            <li
                              key={s}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <Star className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.gaps?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          Gaps / Risks
                        </p>
                        <ul className="space-y-1.5">
                          {c.gaps.map((g) => (
                            <li
                              key={g}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* AI Summary */}
                  <div className="p-4 rounded-xl bg-accent/50 border">
                    <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      AI Analysis
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {c.aiSummary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {candidates.length === 0 && !loading && (
        <div className="glass-card p-12 text-center space-y-2">
          <p className="text-foreground font-semibold">No candidates found</p>
          <p className="text-muted-foreground text-sm">
            AI could not identify any candidates in the uploaded files.
          </p>
          <button
            onClick={() => router.back()}
            className="text-primary text-sm hover:underline mt-2"
          >
            Go back and upload files
          </button>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
