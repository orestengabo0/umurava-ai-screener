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
import { getApplicantById } from "@/lib/api/applicants";
import { ChatInterface } from "@/components/ChatInterface";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ApplicantDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AppLayout>
      <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="px-4 py-2 border-b bg-card flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-accent rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                {data.firstName?.[0]}{data.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-sm font-bold leading-none flex items-center gap-2">
                  {data.firstName} {data.lastName}
                  <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20 px-1 py-0">
                    {data.matchScore}% Match
                  </Badge>
                </h1>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">
                  {data.headline || "Talent Profile"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Profile View (Left) */}
          <div className="flex-1 bg-accent/10 p-4 overflow-y-auto">
            <div className="max-w-4xl space-y-4 pb-8">
              
              {/* AI Recommendation */}
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4 shadow-sm">
                <h3 className="font-bold text-primary flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" /> AI Insights
                </h3>
                <p className="text-foreground leading-relaxed font-medium text-xs">
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

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-card border rounded-md p-4 space-y-3 shadow-sm">
                  <h3 className="font-bold flex items-center gap-2 text-[9px] uppercase tracking-wider text-muted-foreground border-b pb-1.5">
                    Contact
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
                      <Mail className="w-3 h-3 text-primary" /> {data.email}
                    </div>
                    {data.phone && (
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
                        <Phone className="w-3 h-3 text-primary" /> {data.phone}
                      </div>
                    )}
                    {data.location && (
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
                        <MapPin className="w-3 h-3 text-primary" /> {data.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-card border rounded-md p-4 space-y-3 shadow-sm">
                  <h3 className="font-bold flex items-center gap-2 text-[9px] uppercase tracking-wider text-muted-foreground border-b pb-1.5">
                    Profiles
                  </h3>
                  <div className="space-y-2">
                    {data.socialLinks?.linkedin && (
                      <a href={data.socialLinks.linkedin} target="_blank" className="flex items-center gap-2 text-[11px] font-semibold text-foreground hover:text-primary transition-colors">
                        <ExternalLink className="w-3 h-3 text-primary" /> LinkedIn
                      </a>
                    )}
                    {data.socialLinks?.github && (
                      <a href={data.socialLinks.github} target="_blank" className="flex items-center gap-2 text-[11px] font-semibold text-foreground hover:text-primary transition-colors">
                        <ExternalLink className="w-3 h-3 text-primary" /> GitHub
                      </a>
                    )}
                    {!data.socialLinks?.linkedin && !data.socialLinks?.github && <p className="text-[10px] text-muted-foreground italic">No links available</p>}
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <h3 className="font-bold flex items-center gap-2 text-[11px] uppercase tracking-wider px-1">
                  Experience
                </h3>
                <div className="space-y-2">
                  {data.experience?.map((exp: any, i: number) => (
                    <div key={i} className="bg-card border rounded-md p-4 shadow-sm group">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-bold text-foreground text-sm">{exp.role}</h4>
                          <p className="text-primary font-bold text-[10px] uppercase tracking-wider">{exp.company}</p>
                        </div>
                        <Badge variant="secondary" className="rounded-sm font-bold text-[8px] py-0 px-1">
                          {exp.startDate} — {exp.endDate || "Present"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed font-medium">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education & Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-bold flex items-center gap-2 text-[11px] uppercase tracking-wider px-1">Education</h3>
                  <div className="space-y-2">
                    {data.education?.map((edu: any, i: number) => (
                      <div key={i} className="bg-card border rounded-md p-3 shadow-sm">
                        <h4 className="font-bold text-foreground text-[11px]">{edu.degree}</h4>
                        <p className="text-[10px] text-primary font-bold">{edu.institution}</p>
                        <div className="mt-1 text-[8px] text-muted-foreground font-bold uppercase tracking-wider">{edu.startYear} — {edu.endYear || "N/A"}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold flex items-center gap-2 text-[11px] uppercase tracking-wider px-1">Skills</h3>
                  <div className="bg-card border rounded-md p-3 shadow-sm">
                    <div className="flex flex-wrap gap-1">
                      {data.skills?.map((s: any, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-sm bg-accent text-[9px] font-bold text-foreground border">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar (Chat) */}
          <div className="w-[320px] border-l bg-card flex flex-col overflow-hidden shadow-sm z-20">
            <div className="p-2.5 border-b bg-accent/5 flex items-center gap-2">
              <Layout className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">AI Intelligence</span>
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
