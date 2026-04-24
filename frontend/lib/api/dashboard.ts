// lib/api/dashboard.ts

const _RAW_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const BASE = _RAW_BASE.endsWith("/api") ? _RAW_BASE.slice(0, -4) : _RAW_BASE;

export interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  totalApplicants: number;
  recentApplicants: any[];
  activityData: any[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE}/api/dashboard/stats`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return res.json();
}
