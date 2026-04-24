"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { 
  ArrowLeft, 
  Loader2, 
  Brain, 
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Target
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { getApplicants } from "@/lib/api/applicants";
import { getJob } from "@/lib/api/jobs";
import { MatchScoreBar } from "@/components/MatchScoreBar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const recStyles: Record<string, string> = {
  "Highly Recommended": "bg-blue-600 text-white shadow-sm",
  Recommended: "bg-blue-100 text-blue-700 border-blue-200",
  Consider: "bg-gray-100 text-gray-600 border-gray-200",
  "Not Recommended": "bg-red-50 text-red-600 border-red-100",
};

export default function JobResultsPage() {
  const router = useRouter();
  const { id: jobId } = useParams<{ id: string }>();

  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "assistant", content: "I've analyzed all candidates against the job requirements. Ask me why someone ranked higher or how a specific candidate fits!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    const el = chatTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [chatInput]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobData, applicantsRes] = await Promise.all([
          getJob(jobId),
          getApplicants(jobId)
        ]);
        setJob(jobData);
        const sorted = (applicantsRes.data || []).sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));
        setApplicants(sorted);
      } catch (err) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  const handleChat = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    if (chatTextareaRef.current) chatTextareaRef.current.style.height = "auto";
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/jobs/${jobId}/chat-results`, { 
        message: msg,
        context: applicants.map(a => ({
          name: `${a.firstName} ${a.lastName}`,
          score: a.matchScore,
          recommendation: a.recommendation,
          aiSummary: a.aiSummary,
          strengths: a.strengths,
          gaps: a.gaps
        }))
      });
      setChatMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
    } catch (err) {
      toast.error("Chat failed");
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, jobId, applicants]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Brain className="w-8 h-8 text-primary absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="font-bold text-muted-foreground">Synthesizing candidate data...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-56px)] overflow-hidden relative">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-md p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/jobs/${jobId}`)}
                className="w-8 h-8 rounded-md bg-accent flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Ranking
                </h1>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  {job?.title} • <span className="text-primary">{applicants.length} Screened</span>
                </p>
              </div>
            </div>
            <Button 
              className="rounded-md h-9 px-4 font-bold gap-2 text-xs"
              onClick={() => setChatOpen(true)}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Insight
            </Button>
          </div>

          <div className="space-y-2 pb-8">
            {applicants.map((c, i) => (
              <div 
                key={c._id} 
                className={cn(
                  "rounded-md border bg-card overflow-hidden shadow-sm transition-all",
                  expanded === c._id ? "ring-1 ring-primary/20 border-primary/30" : ""
                )}
              >
                <button
                  className="w-full flex items-center gap-3 p-3 text-left"
                  onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center font-bold text-primary text-xs border border-primary/20">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground tracking-tight">{c.firstName} {c.lastName}</h3>
                      <Badge className={cn("text-[8px] font-bold uppercase tracking-wider px-1.5 py-0 px-1", recStyles[c.recommendation])}>
                        {c.recommendation}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wider">{c.email}</p>
                  </div>
                  <div className="w-32 hidden md:block">
                    <MatchScoreBar score={c.matchScore} />
                  </div>
                  <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground transition-colors">
                    {expanded === c._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {expanded === c._id && (
                  <div className="px-5 pb-5 pt-3 border-t space-y-4 bg-accent/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-success" />
                          Strengths
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {c.strengths?.map((s: string) => (
                            <Badge key={s} variant="outline" className="bg-success/5 text-success border-success/20 py-0.5 px-1.5 rounded-sm font-bold text-[9px]">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-warning" />
                          Gaps
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {c.gaps?.map((g: string) => (
                            <Badge key={g} variant="outline" className="bg-warning/5 text-warning border-warning/20 py-0.5 px-1.5 rounded-sm font-bold text-[9px]">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-md p-3 shadow-sm">
                      <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1.5">AI Summary</p>
                      <p className="text-xs font-medium text-foreground leading-relaxed italic border-l-2 border-primary/20 pl-2.5">
                        "{c.aiSummary}"
                      </p>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <Button 
                        className="rounded-md h-8 px-3 font-bold gap-1.5 text-[10px]"
                        onClick={() => router.push(`/applicants/${c._id}`)}
                      >
                        Details <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Sidebar Chat */}
        <div className={cn(
          "fixed lg:relative inset-y-0 right-0 z-40 w-full sm:w-[340px] bg-card border-l shadow-xl transition-all duration-300 transform flex flex-col",
          chatOpen ? "translate-x-0" : "translate-x-full lg:hidden"
        )}>
          <div className="p-3 border-b flex items-center justify-between bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <div>
                <h3 className="font-bold text-sm tracking-tight">AI Assistant</h3>
                <p className="text-[8px] font-bold uppercase tracking-wider opacity-70">Analysis</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-md hover:bg-white/10 h-7 w-7" onClick={() => setChatOpen(false)}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-accent/5">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={cn(
                  "max-w-[88%] rounded-md px-3 py-2 text-[11px] leading-relaxed",
                  m.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-white border text-foreground"
                )}>
                  <MarkdownMessage content={m.content} isUser={m.role === "user"} />
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-md px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="p-3 border-t bg-card">
            <div className="flex items-end gap-2 bg-accent/20 border rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <textarea
                ref={chatTextareaRef}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleChat();
                  }
                }}
                placeholder="Ask AI... (Enter to send)"
                rows={1}
                className="flex-1 bg-transparent resize-none text-[11px] font-medium outline-none placeholder:text-muted-foreground/60 max-h-[120px] leading-relaxed"
              />
              <button
                onClick={handleChat}
                disabled={!chatInput.trim() || chatLoading}
                className="flex-shrink-0 p-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-opacity mb-0.5"
              >
                {chatLoading
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Send className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-[8px] text-muted-foreground/40 mt-1 text-right font-medium uppercase tracking-wider">
              Enter ↵ send · Shift+Enter newline
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
