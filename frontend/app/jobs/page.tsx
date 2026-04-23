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
  Filter,
  ChevronLeft,
  Calendar,
  Layers
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getJobs,
  setJobStatus,
  deleteJob,
  type Job,
  type JobStatus,
} from "@/lib/api/jobs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const EXP_LABELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJobs({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        page,
        limit: 8
      });
      setJobs(res.jobs);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleToggleStatus = async (job: Job) => {
    setActionId(job._id);
    try {
      const next: JobStatus = job.status === "open" ? "closed" : "open";
      const updated = await setJobStatus(job._id, next);
      setJobs((prev) => prev.map((j) => (j._id === updated._id ? updated : j)));
      toast.success(`Job ${next === "open" ? "reopened" : "closed"}`);
    } catch {
      toast.error("Status update failed");
    } finally {
      setActionId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionId(deleteTarget._id);
    try {
      await deleteJob(deleteTarget._id);
      setJobs((prev) => prev.filter((j) => j._id !== deleteTarget._id));
      toast.success("Job deleted");
    } catch {
      toast.error("Deletion failed");
    } finally {
      setActionId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Job Architecture</h1>
            <p className="text-muted-foreground mt-0.5 text-[10px] font-bold uppercase tracking-wider">
              {total} Total Listings
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 rounded-md px-5 h-10 text-xs font-bold"
            onClick={() => router.push("/jobs/create")}
          >
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-card border rounded-md p-1.5 shadow-sm">
          {/* Status buttons */}
          <div className="flex items-center gap-1 bg-accent/30 rounded-md p-1">
            {(["all", "open", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  "flex-1 sm:flex-none px-3 py-1 rounded-sm text-[10px] font-bold capitalize transition-all",
                  statusFilter === s
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-border hidden lg:block mx-1" />

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title or stack..."
              className="w-full pl-9 pr-3 h-9 rounded-md border-none bg-accent/20 text-[11px] font-semibold outline-none"
            />
          </div>
        </div>

        {/* Job Grid */}
        <div className="space-y-3 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary opacity-20" />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Scanning...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-md border-2 border-dashed bg-card/50 py-16 text-center">
              <h3 className="text-sm font-bold text-foreground">Zero Listings Found</h3>
              <p className="text-muted-foreground mt-1 text-[10px] font-medium uppercase tracking-wider">
                Try adjusting your filters or post a new job.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="group relative flex flex-col justify-between rounded-md border bg-card p-4 shadow-sm hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-9 h-9 rounded-md bg-primary/5 flex items-center justify-center text-primary">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge 
                        className={cn(
                          "rounded-sm px-1.5 py-0 font-bold text-[8px] uppercase tracking-wider",
                          job.status === "open" 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-100 text-gray-400 border"
                        )}
                      >
                        {job.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-md h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.preventDefault(); setDeleteTarget(job); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-1">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-1 bg-accent/30 px-1.5 py-0.5 rounded-sm">
                        <MapPin className="w-2.5 h-2.5" /> {job.location || "Remote"}
                      </div>
                      <div className="flex items-center gap-1 bg-accent/30 px-1.5 py-0.5 rounded-sm">
                        <Calendar className="w-2.5 h-2.5" /> {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {job.requiredSkills.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="text-[8px] font-bold text-muted-foreground/60 bg-accent/20 px-1 py-0 rounded-sm">
                          {s}
                        </span>
                      ))}
                      {job.requiredSkills.length > 2 && (
                        <span className="text-[8px] font-bold text-primary">+{job.requiredSkills.length - 2}</span>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      className="rounded-md h-7 px-2 gap-1 text-primary font-bold text-[10px] uppercase tracking-wider"
                      onClick={() => router.push(`/jobs/${job._id}`)}
                    >
                      Open <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-md h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-md text-[10px] font-bold transition-all",
                    page === i + 1 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-md h-8 w-8"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Delete Dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Mission?"
          description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
          confirmText="Delete"
        />
      </div>
    </AppLayout>
  );
}
