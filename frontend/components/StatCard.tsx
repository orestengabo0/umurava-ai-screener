import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, change, icon: Icon, trend = "neutral" }: StatCardProps) {
  return (
    <Card className="p-4 rounded-md shadow-sm border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold text-foreground mt-1 tracking-tight">{value}</p>
          {change && (
            <p
              className={cn(
                "text-[8px] font-black mt-1 uppercase tracking-widest",
                trend === "up" && "text-blue-600",
                trend === "down" && "text-slate-400",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
