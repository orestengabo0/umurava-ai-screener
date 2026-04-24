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
  Brain,
  History,
  Layout,
  ExternalLink,
  Target
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getJob, setJobStatus, deleteJob, type Job, type JobStatus } from "@/lib/api/jobs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const EXP_LABELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getJob(id)
      .then(setJob)
      .catch(() => toast.error("Failed to load job details"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      const next: JobStatus = job.status === "open" ? "closed" : "open";
      const updated = await setJobStatus(job._id, next);
      setJob(updated);
      toast.success(`Job marked as ${next}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await deleteJob(job._id);
      toast.success("Job deleted permanently");
      router.push("/jobs");
    } catch {
      toast.error("Failed to delete job");
    } finally {
      setActionLoading(false);
      setIsDeleting(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
          <p className="font-bold text-muted-foreground animate-pulse">Loading job architecture...</p>
        </div>
      </AppLayout>
    );
  }

  if (!job) return null;

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {/* Back Navigation */}
        <button
          onClick={() => router.push("/jobs")}
          className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Jobs
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-md p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
                <div className="space-y-2">
                  <Badge className={cn(
                    "rounded-sm px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-wider",
                    job.status === "open" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                  )}>
                    {job.status}
                  </Badge>
                  <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground pt-1 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-primary" /> {job.location || "Remote"}
                    </span>
                    <span className="flex items-center gap-1.5 border-l pl-4">
                      <Calendar className="w-3 h-3 text-primary" /> {fmt(job.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2 relative z-10">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Layout className="w-3 h-3" /> Description
                </h3>
                <p className="text-foreground font-medium leading-relaxed whitespace-pre-wrap text-xs">
                  {job.description}
                </p>
              </div>

              {job.requiredSkills.length > 0 && (
                <div className="mt-8 pt-6 border-t space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {job.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-2 py-0.5 rounded-sm bg-accent/50 text-primary border-none font-bold text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions & Stats */}
          <div className="space-y-4">
            <div className="bg-card border rounded-md p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground px-1">Actions</h3>
              
              <div className="space-y-1.5">
                <Button 
                  size="lg" 
                  className="w-full rounded-md h-10 font-bold text-xs gap-2"
                  onClick={() => router.push(`/applicants?jobId=${job._id}`)}
                >
                  <Brain className="w-4 h-4" />
                  Screen Resumes
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full rounded-md h-10 font-bold border-primary/20 text-primary hover:bg-primary/5 gap-2 text-xs"
                  onClick={() => router.push(`/jobs/${job._id}/results`)}
                >
                  <Target className="w-4 h-4" />
                  View Ranking
                </Button>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Button 
                    variant="secondary" 
                    className="rounded-md h-9 font-bold gap-2 bg-accent/30 text-muted-foreground hover:text-foreground text-[10px]"
                    onClick={() => router.push(`/jobs/${job._id}/applicants`)}
                  >
                    <History className="w-3 h-3" /> History
                  </Button>
                  <Button 
                    variant="secondary" 
                    className={cn(
                      "rounded-md h-9 font-bold gap-2 text-[10px]",
                      job.status === "open" ? "text-orange-600 bg-orange-50 hover:bg-orange-100" : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    )}
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : job.status === "open" ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {job.status === "open" ? "Close" : "Reopen"}
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full rounded-md h-9 font-bold text-destructive hover:bg-destructive/10 gap-2 mt-1 text-[10px]"
                  onClick={() => setIsDeleting(true)}
                  disabled={actionLoading}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Job
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={isDeleting}
          onClose={() => setIsDeleting(false)}
          onConfirm={handleConfirmDelete}
          title="Permanently Delete Job?"
          description={`Are you sure you want to delete "${job.title}"? This will also remove all candidate screening data associated with this job. This action cannot be undone.`}
          confirmText="Yes, Delete Permanently"
        />
      </div>
    </AppLayout>
  );
}
