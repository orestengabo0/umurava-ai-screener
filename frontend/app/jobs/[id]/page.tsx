"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Loader2,
  Tag,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { getJob, setJobStatus, deleteJob, type Job, type JobStatus } from "@/lib/api/jobs";
import { cn } from "@/lib/utils";

const EXP_LABELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead / Staff",
  executive: "Executive",
};

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getJob(id)
      .then(setJob)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load job")
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      const next: JobStatus = job.status === "open" ? "closed" : "open";
      const updated = await setJobStatus(job._id, next);
      setJob(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await deleteJob(job._id);
      router.push("/jobs");
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <AppLayout>
      <div className="page-container space-y-6 p-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && job && (
          <div className="space-y-5">
            {/* Header card */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span>{EXP_LABELS[job.experienceLevel]}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Created {fmt(job.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    "text-sm font-medium px-3 py-1 rounded-full flex-shrink-0",
                    job.status === "open"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {job.status === "open" ? "Open" : "Closed"}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2 border-t">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl"
                  disabled={actionLoading}
                  onClick={handleToggleStatus}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : job.status === "open" ? (
                    <ToggleRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  {job.status === "open" ? "Close Job" : "Reopen Job"}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  disabled={actionLoading}
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Job
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-3">
              <h2 className="font-semibold text-foreground">Job Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Skills */}
            {job.requiredSkills.length > 0 && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-3">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
