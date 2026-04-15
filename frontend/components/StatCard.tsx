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
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-semibold">{title}</p>
          <p className="text-3xl font-extrabold text-foreground mt-2 tracking-tight">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs font-medium mt-2",
                trend === "up" && "text-success",
                trend === "down" && "text-destructive",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#1b6df2]" />
        </div>
      </div>
    </Card>
  );
}
