"use client";

import { useEffect, useState } from "react";
import { 
  Briefcase, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, type DashboardStats } from "@/lib/api/dashboard";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Dashboard stats failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const kpis = [
    { title: "Total Jobs", value: stats?.totalJobs || 0, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Open Jobs", value: stats?.openJobs || 0, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Applicants", value: stats?.totalApplicants || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-xs font-medium">Welcome back! Here's what's happening today.</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <Card key={i} className="border shadow-sm bg-card rounded-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-md ${kpi.bg}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                  <h3 className="text-lg font-bold mt-0.5">{kpi.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 border shadow-sm rounded-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
              <CardTitle className="text-base font-bold">Recent Ingestions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {stats?.recentApplicants?.map((app: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-accent/5 border border-transparent hover:border-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                        {app.firstName?.[0]}{app.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-xs">{app.firstName} {app.lastName}</p>
                        <p className="text-[10px] text-muted-foreground">{app.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold">{app.matchScore}% Match</p>
                        <p className="text-[9px] text-muted-foreground">{new Date(app.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-sm text-[9px] px-1.5 py-0">
                        Processed
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!stats?.recentApplicants || stats.recentApplicants.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-xs">No recent activity found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border shadow-sm rounded-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <Button className="w-full justify-start rounded-md h-9 text-xs font-bold" variant="outline" asChild>
                  <a href="/jobs/create">Create New Job</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}