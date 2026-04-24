"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Award, 
  Bot,
  X,
  MessageSquare
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
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
  const [chatOpen, setChatOpen] = useState(false);

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
          <Loader2 className="w-6 h-6 animate-spin text-primary opacity-40" />
        </div>
      </AppLayout>
    );
  }

  if (!data) return null;

  return (
    <AppLayout>
      <div className="relative flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-background">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-b bg-card flex items-center justify-between shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-accent rounded-md transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0 border border-primary/20">
              {data.firstName?.[0]}{data.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-none flex items-center gap-2 truncate">
                {data.firstName} {data.lastName}
                <Badge
                  variant="outline"
                  className="text-[8px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20 px-1 py-0 flex-shrink-0"
                >
                  {data.matchScore}%
                </Badge>
              </h1>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider truncate">
                {data.headline || "Talent Profile"}
              </p>
            </div>
          </div>

          {/* AI Chat Toggle */}
          <button
            onClick={() => setChatOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex-shrink-0",
              chatOpen
                ? "bg-primary text-primary-foreground"
                : "bg-accent/60 hover:bg-primary hover:text-primary-foreground text-muted-foreground"
            )}
          >
            <MessageSquare className="w-3 h-3" />
            <span className="hidden sm:inline">AI Chat</span>
          </button>
        </div>

        {/* ── Profile Content (always full width) ────────────── */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 pb-24">

            {/* AI Recommendation */}
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4 shadow-sm">
              <h3 className="font-bold text-primary flex items-center gap-2 mb-2 text-[9px] uppercase tracking-widest">
                <Award className="w-3 h-3" /> AI Insights
              </h3>
              <p className="text-foreground leading-relaxed font-medium text-[11px]">
                {data.aiSummary}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {data.strengths?.map((s: string) => (
                  <Badge key={s} className="bg-blue-600/10 text-blue-700 border-blue-600/20 py-0.5 px-1.5 rounded-sm text-[8px] font-bold">
                    {s}
                  </Badge>
                ))}
                {data.gaps?.map((g: string) => (
                  <Badge key={g} className="bg-orange-600/10 text-orange-700 border-orange-600/20 py-0.5 px-1.5 rounded-sm text-[8px] font-bold">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contact + Profiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-card border rounded-md p-4 space-y-2.5 shadow-sm">
                <h3 className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground border-b pb-1.5">
                  Contact
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
                    <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="truncate">{data.email}</span>
                  </div>
                  {data.phone && (
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
                      <Phone className="w-3 h-3 text-primary flex-shrink-0" /> {data.phone}
                    </div>
                  )}
                  {data.location && (
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
                      <MapPin className="w-3 h-3 text-primary flex-shrink-0" /> {data.location}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border rounded-md p-4 space-y-2.5 shadow-sm">
                <h3 className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground border-b pb-1.5">
                  Profiles
                </h3>
                <div className="space-y-2">
                  {data.socialLinks?.linkedin && (
                    <a href={data.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[11px] font-semibold text-foreground hover:text-primary transition-colors">
                      <ExternalLink className="w-3 h-3 text-primary" /> LinkedIn
                    </a>
                  )}
                  {data.socialLinks?.github && (
                    <a href={data.socialLinks.github} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[11px] font-semibold text-foreground hover:text-primary transition-colors">
                      <ExternalLink className="w-3 h-3 text-primary" /> GitHub
                    </a>
                  )}
                  {!data.socialLinks?.linkedin && !data.socialLinks?.github && (
                    <p className="text-[10px] text-muted-foreground italic">No links available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Experience */}
            {data.experience?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-[10px] uppercase tracking-widest px-0.5 text-muted-foreground">
                  Experience
                </h3>
                <div className="space-y-2">
                  {data.experience.map((exp: any, i: number) => (
                    <div key={i} className="bg-card border rounded-md p-4 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground text-sm leading-tight">{exp.role}</h4>
                          <p className="text-primary font-bold text-[9px] uppercase tracking-wider mt-0.5">{exp.company}</p>
                        </div>
                        <Badge variant="secondary" className="rounded-sm font-bold text-[8px] py-0 px-1.5 flex-shrink-0">
                          {exp.startDate} — {exp.endDate || "Present"}
                        </Badge>
                      </div>
                      {exp.description && (
                        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed font-medium">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education + Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.education?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest px-0.5 text-muted-foreground">Education</h3>
                  <div className="space-y-2">
                    {data.education.map((edu: any, i: number) => (
                      <div key={i} className="bg-card border rounded-md p-3 shadow-sm">
                        <h4 className="font-bold text-foreground text-[11px]">{edu.degree}</h4>
                        <p className="text-[10px] text-primary font-bold mt-0.5">{edu.institution}</p>
                        <div className="mt-1 text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
                          {edu.startYear} — {edu.endYear || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.skills?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-[10px] uppercase tracking-widest px-0.5 text-muted-foreground">Skills</h3>
                  <div className="bg-card border rounded-md p-3 shadow-sm">
                    <div className="flex flex-wrap gap-1">
                      {data.skills.map((s: any, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-sm bg-accent text-[9px] font-bold text-foreground border">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Chat Overlay ────────────────────────────────────── */}
        {/* Backdrop */}
        {chatOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setChatOpen(false)}
          />
        )}

        {/* Drawer panel — slides in from right */}
        <div className={cn(
          "fixed inset-y-0 right-0 z-40 flex flex-col bg-card border-l shadow-2xl transition-transform duration-300",
          "w-full sm:w-[380px]",
          chatOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Drawer header */}
          <div className="px-4 py-3 border-b bg-primary text-primary-foreground flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <div>
                <p className="font-bold text-sm leading-none">AI Assistant</p>
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-0.5">
                  {data.firstName} {data.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat content */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface applicantId={id} />
          </div>
        </div>

        {/* ── Floating Chat FAB (when chat is closed) ─────────── */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 h-11 rounded-md bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold text-xs"
          >
            <MessageSquare className="w-4 h-4" />
            Ask AI
          </button>
        )}
      </div>
    </AppLayout>
  );
}


