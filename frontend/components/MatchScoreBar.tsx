import { cn } from "@/lib/utils";

interface MatchScoreBarProps {
  score: number;
  className?: string;
}

export function MatchScoreBar({ score, className }: MatchScoreBarProps) {
  const getColor = () => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-foreground w-10 text-right">{score}%</span>
    </div>
  );
}
