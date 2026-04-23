import { cn } from "@/lib/utils";

interface MatchScoreBarProps {
  score: number;
  className?: string;
}

export function MatchScoreBar({ score, className }: MatchScoreBarProps) {
  const getColor = () => {
    if (score >= 80) return "bg-blue-600";
    if (score >= 60) return "bg-blue-400";
    return "bg-slate-400";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1 rounded-md bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-md transition-all duration-500", getColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[9px] font-black text-foreground w-7 text-right uppercase tracking-tighter">{score}%</span>
    </div>
  );
}
