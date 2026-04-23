"use client";

import { useState } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatWithApplicant } from "@/lib/api/applicants";
import { toast } from "sonner";

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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
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
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-md border shadow-sm overflow-hidden">
      <div className="p-3 border-b bg-accent/30 flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        <span className="font-bold text-xs uppercase tracking-wider">AI Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] rounded-md px-3 py-2 text-xs font-medium ${
              m.role === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-accent/50 text-foreground"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-accent/50 rounded-md px-3 py-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-accent/10">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="w-full pl-3 pr-10 h-10 rounded-md border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
