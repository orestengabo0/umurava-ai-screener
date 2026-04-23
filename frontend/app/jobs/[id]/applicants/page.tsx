"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  Loader2, 
  Search, 
  Trash2,
  ExternalLink,
  History,
  Brain,
  ChevronRight,
  TrendingUp,
  FileText,
  Plus,
  Calendar
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getApplicants, deleteApplicant, deleteAllApplicantsForJob } from "@/lib/api/applicants";
import { getJob, type Job } from "@/lib/api/jobs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function JobApplicantsPage() {
  const router = useRouter();
  const { id: jobId } = useParams<{ id: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobData, applicantsRes] = await Promise.all([
          getJob(jobId),
          getApplicants(jobId)
        ]);
        setJob(jobData);
        setApplicants(applicantsRes.data || []);
      } catch (err) {
        toast.error("Failed to load screening data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  const handleDeleteOne = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApplicant(deleteTarget._id);
      setApplicants(prev => prev.filter(a => a._id !== deleteTarget._id));
      toast.success("Applicant record removed");
    } catch {
      toast.error("Failed to remove record");
    } finally {
      setDeleteTarget(null);
    }
  };
 
  const handleDeleteAll = async () => {
    try {
      await deleteAllApplicantsForJob(jobId);
      setApplicants([]);
      toast.success("History cleared successfully");
    } catch {
      toast.error("Failed to clear history");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filtered = applicants.filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {/* Breadcrumb / Back */}
        <button
          onClick={() => router.push(`/jobs/${jobId}`)}
          className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Job Details
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border rounded-md p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2 tracking-tight">
                Screening History
              </h1>
              <p className="text-muted-foreground mt-0.5 text-[10px] font-bold uppercase tracking-wider">
                {job?.title} • <span className="text-primary">{applicants.length} screened</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {applicants.length > 0 && (
              <Button 
                variant="outline"
                className="rounded-md border-destructive/20 text-destructive h-9 px-3 text-[10px] font-bold"
                onClick={() => setIsDeletingAll(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear History
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => router.push(`/jobs/${jobId}/results`)}
              className="rounded-md border-primary/20 text-primary h-9 px-3 gap-1.5 text-[10px] font-bold"
              disabled={applicants.length === 0}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Ranking
            </Button>
            <Button 
              onClick={() => router.push(`/applicants?jobId=${jobId}`)}
              className="rounded-md h-9 px-4 text-[10px] font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Upload
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="bg-card border rounded-md p-1 shadow-sm flex items-center w-full md:w-80">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 h-8 rounded-md bg-transparent text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Applicant List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary opacity-20" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fetching...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed bg-card/50 p-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No screening data</h3>
              <p className="text-muted-foreground mt-1 text-[10px] font-medium uppercase tracking-wider">
                Upload resumes to start.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filtered.map((a) => (
                <div 
                  key={a._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border bg-card p-3 shadow-sm hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-md bg-accent flex flex-col items-center justify-center flex-shrink-0 border">
                    <span className="text-sm font-bold text-primary leading-none">{a.matchScore}%</span>
                    <span className="text-[8px] font-bold uppercase text-muted-foreground mt-0.5">Match</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground tracking-tight">
                        {a.firstName} {a.lastName}
                      </h3>
                      <Badge className={cn(
                        "rounded-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                        a.recommendation === "Highly Recommended" ? "bg-blue-600 text-white" :
                        a.recommendation === "Recommended" ? "bg-blue-100 text-blue-700" :
                        a.recommendation === "Consider" ? "bg-gray-100 text-gray-600" :
                        "bg-red-100 text-red-600"
                      )}>
                        {a.recommendation}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {a.email}</span>
                      <span className="hidden md:flex items-center gap-1 border-l pl-3"><Calendar className="w-3 h-3" /> {new Date(a.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-md h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(a)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      className="rounded-md h-8 px-3 text-[10px] font-bold"
                      onClick={() => router.push(`/applicants/${a._id}`)}
                    >
                      Report
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>



        {/* Delete Single Dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteOne}
          title="Remove Applicant"
          description={`Remove "${deleteTarget?.firstName} ${deleteTarget?.lastName}"?`}
          confirmText="Remove"
        />

        {/* Delete All Dialog */}
        <ConfirmDialog
          isOpen={isDeletingAll}
          onClose={() => setIsDeletingAll(false)}
          onConfirm={handleDeleteAll}
          title="Clear History"
          description="Permanently delete ALL records for this job?"
          confirmText="Clear All"
        />
      </div>
    </AppLayout>

  );
}
