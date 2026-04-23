"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  FileText, 
  Download,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Award,
  Briefcase,
  GraduationCap,
  Layout,
  Globe,
  Languages,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { getApplicantById } from "@/lib/api/applicants";
import { ChatInterface } from "@/components/ChatInterface";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ApplicantDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"ai" | "pdf">("ai");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getApplicantById(id);
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load applicant data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!data) return null;

  const { resumeFile } = data;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-card flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                {data.firstName?.[0]}{data.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold leading-none flex items-center gap-2">
                  {data.firstName} {data.lastName}
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider ml-2 bg-primary/5 text-primary border-primary/20">
                    {data.matchScore}% Match
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.headline || "Applicant"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-accent rounded-xl p-1 mr-4">
              <button 
                onClick={() => setViewMode("ai")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  viewMode === "ai" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                AI Profile
              </button>
              <button 
                onClick={() => setViewMode("pdf")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  viewMode === "pdf" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Original PDF
              </button>
            </div>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" asChild>
              <a href={resumeFile?.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" /> Download
              </a>
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document Content (Left) */}
          <div className="flex-1 bg-accent/30 p-6 overflow-y-auto">
            {viewMode === "pdf" ? (
              <div className="h-full bg-white rounded-2xl border shadow-lg overflow-hidden relative">
                {resumeFile?.cloudinaryUrl ? (
                  <iframe
                    src={`${resumeFile.cloudinaryUrl}#toolbar=0`}
                    className="w-full h-full border-none"
                    title="Resume PDF"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileText className="w-12 h-12 mb-2 opacity-20" />
                    <p>No original PDF available</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6 pb-12">
                {/* AI Summary Card */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Layout className="w-24 h-24 rotate-12" />
                  </div>
                  <h3 className="font-bold text-primary flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5" /> AI Executive Summary
                  </h3>
                  <p className="text-foreground leading-relaxed relative z-10">
                    {data.aiSummary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.strengths?.map((s: string) => (
                      <Badge key={s} className="bg-success/10 text-success border-success/20 pointer-events-none">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {s}
                      </Badge>
                    ))}
                    {data.gaps?.map((g: string) => (
                      <Badge key={g} className="bg-warning/10 text-warning border-warning/20 pointer-events-none">
                        <AlertCircle className="w-3 h-3 mr-1" /> {g}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact & Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card border rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                      <Mail className="w-4 h-4" /> Contact
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Mail className="w-4 h-4 text-primary" /></div>
                        {data.email}
                      </div>
                      {data.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Phone className="w-4 h-4 text-primary" /></div>
                          {data.phone}
                        </div>
                      )}
                      {data.location && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><MapPin className="w-4 h-4 text-primary" /></div>
                          {data.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-card border rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                      <Globe className="w-4 h-4" /> Socials & Web
                    </h3>
                    <div className="space-y-3">
                      {data.socialLinks?.linkedin && (
                        <a href={data.socialLinks.linkedin} target="_blank" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><ExternalLink className="w-4 h-4 text-primary" /></div>
                          LinkedIn Profile
                        </a>
                      )}
                      {data.socialLinks?.github && (
                        <a href={data.socialLinks.github} target="_blank" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><ExternalLink className="w-4 h-4 text-primary" /></div>
                          GitHub Portfolio
                        </a>
                      )}
                      {!data.socialLinks?.linkedin && !data.socialLinks?.github && <p className="text-sm text-muted-foreground italic">No social links provided</p>}
                    </div>
                  </div>
                </div>

                {/* Experience Section */}
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5 text-primary" /> Work Experience
                  </h3>
                  <div className="space-y-4">
                    {data.experience?.map((exp: any, i: number) => (
                      <div key={i} className="bg-card border rounded-2xl p-6 relative">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-foreground">{exp.role}</h4>
                            <p className="text-primary font-medium">{exp.company}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="rounded-lg font-mono text-[10px]">
                              {exp.startDate} — {exp.endDate || "Present"}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                          {exp.description}
                        </p>
                        {exp.technologies?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {exp.technologies.map((t: string) => (
                              <span key={t} className="px-2 py-0.5 rounded-md bg-accent text-[10px] font-medium text-muted-foreground">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education Section */}
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-lg">
                    <GraduationCap className="w-5 h-5 text-primary" /> Education
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.education?.map((edu: any, i: number) => (
                      <div key={i} className="bg-card border rounded-2xl p-5">
                        <h4 className="font-bold text-foreground">{edu.degree}</h4>
                        <p className="text-sm text-primary">{edu.institution}</p>
                        <p className="text-xs text-muted-foreground mt-1">{edu.fieldOfStudy}</p>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <Calendar className="w-3 h-3" /> {edu.startYear} — {edu.endYear || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-lg">
                    <Languages className="w-5 h-5 text-primary" /> Skills & Expertise
                  </h3>
                  <div className="bg-card border rounded-2xl p-6">
                    <div className="flex flex-wrap gap-2">
                      {data.skills?.map((s: any, i: number) => (
                        <div key={i} className="flex flex-col gap-1">
                          <Badge variant="secondary" className="rounded-lg px-3 py-1 gap-2 flex items-center">
                            <span className="font-bold">{s.name}</span>
                            <span className="text-[10px] text-muted-foreground border-l pl-2">{s.level}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar (Chat) */}
          <div className="w-[450px] border-l bg-card flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b bg-accent/10 flex items-center gap-2">
              <Layout className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Analytical Chat</span>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatInterface applicantId={id} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
