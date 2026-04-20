"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  ChevronRight,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  getJobs,
  setJobStatus,
  deleteJob,
  type Job,
  type JobStatus,
} from "@/lib/api/jobs";
import { cn } from "@/lib/utils";

const EXP_LABELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead / Staff",
  executive: "Executive",
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobs(filter === "all" ? undefined : filter);
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const handleToggleStatus = async (job: Job) => {
    setActionId(job._id);
    try {
      const next: JobStatus = job.status === "open" ? "closed" : "open";
      const updated = await setJobStatus(job._id, next);
      setJobs((prev) => prev.map((j) => (j._id === updated._id ? updated : j)));
    } catch {
      // silently ignore, or toast
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    setActionId(job._id);
    try {
      await deleteJob(job._id);
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
    } catch {
      // silently ignore, or toast
    } finally {
      setActionId(null);
    }
  };

  const displayed = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-container space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage all your job postings
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 rounded-xl"
            onClick={() => router.push("/jobs/create")}
          >
            <Plus className="w-4 h-4" />
            Create New Job
          </Button>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {(["all", "open", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                  filter === s
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            />
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-3"
              onClick={fetchJobs}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="rounded-2xl border bg-card p-16 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground">No jobs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Try a different search term"
                : "Create your first job to get started"}
            </p>
          </div>
        )}

        {/* Job list */}
        {!loading && !error && displayed.length > 0 && (
          <div className="space-y-3">
            {displayed.map((job) => (
              <div
                key={job._id}
                className="group flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm hover:border-primary/30 transition-all animate-fade-in"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">
                      {job.title}
                    </p>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        job.status === "open"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    )}
                    {job.experienceLevel && (
                      <span>{EXP_LABELS[job.experienceLevel]}</span>
                    )}
                    {job.requiredSkills.length > 0 && (
                      <span className="truncate">
                        {job.requiredSkills.slice(0, 3).join(", ")}
                        {job.requiredSkills.length > 3 &&
                          ` +${job.requiredSkills.length - 3}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title={job.status === "open" ? "Close job" : "Open job"}
                    disabled={actionId === job._id}
                    onClick={() => handleToggleStatus(job)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    {actionId === job._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : job.status === "open" ? (
                      <ToggleRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    title="Delete job"
                    disabled={actionId === job._id}
                    onClick={() => handleDelete(job)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Detail link */}
                <Link
                  href={`/jobs/${job._id}`}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
