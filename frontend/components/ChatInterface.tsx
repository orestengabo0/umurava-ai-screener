"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Bot } from "lucide-react";
import { chatWithApplicant } from "@/lib/api/applicants";
import { toast } from "sonner";
import { MarkdownMessage } from "@/components/MarkdownMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface({ applicantId }: { applicantId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I've analyzed this resume. Ask me anything about the candidate's skills, experience, or fit for the role." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-grow textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    // reset height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await chatWithApplicant(applicantId, userMsg);
      setMessages(prev => [...prev, { role: "assistant", content: res.response }]);
    } catch (err) {
      toast.error("Failed to get AI response");
    } finally {
      setLoading(false);
    }
  }, [input, loading, applicantId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-accent/20 flex items-center gap-2">
        <Bot className="w-3.5 h-3.5 text-primary" />
        <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">AI Assistant</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-md px-3 py-2 text-[11px] leading-relaxed ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-accent/40 text-foreground border border-accent"
            }`}>
              <MarkdownMessage content={m.content} isUser={m.role === "user"} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-accent/40 border border-accent rounded-md px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex items-end gap-2 bg-accent/20 border rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent resize-none text-[11px] font-medium outline-none placeholder:text-muted-foreground/60 max-h-[140px] leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 p-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-opacity mb-0.5"
          >
            {loading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Send className="w-3 h-3" />
            }
          </button>
        </div>
        <p className="text-[8px] text-muted-foreground/40 mt-1 text-right font-medium uppercase tracking-wider">
          Enter ↵ send · Shift+Enter newline
        </p>
      </div>
    </div>
  );
}
