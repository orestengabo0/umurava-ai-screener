"use client";

import Link from "next/link";
import {
    Briefcase,
    Users,
    Trophy,
    Clock,
    Plus,
    ArrowRight,
} from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const recentActivity = [
    { id: 1, text: "New applicant for Senior React Developer", time: "2 min ago", type: "applicant" },
    { id: 2, text: "AI screening completed for UX Designer role", time: "15 min ago", type: "screening" },
    { id: 3, text: "Job posting published: Data Engineer", time: "1 hour ago", type: "job" },
    { id: 4, text: "3 candidates shortlisted for PM role", time: "2 hours ago", type: "shortlist" },
    { id: 5, text: "New applicant for Backend Engineer", time: "3 hours ago", type: "applicant" },
];

const dotColor: Record<string, string> = {
    applicant: "bg-primary",
    screening: "bg-success",
    job: "bg-warning",
    shortlist: "bg-info",
};

export default function DashboardPage() {
    return (
        <AppLayout>
            <div className="page-container space-y-8 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-2xl">Dashboard</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Welcome back, Sarah. Here's your recruitment overview.
                        </p>
                    </div>

                    <Link href="/jobs/create">
                        <Button size="lg" className="gap-2 rounded-xl">
                            <Plus className="w-4 h-4" />
                            Create New Job
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard title="Total Jobs" value={24} change="+3 this week" icon={Briefcase} trend="up" />
                    <StatCard title="Total Applicants" value={482} change="+47 this week" icon={Users} trend="up" />
                    <StatCard title="Screened Candidates" value={156} change="+12 today" icon={Trophy} trend="up" />
                    <StatCard title="Avg. Screening Time" value="2.4s" change="-0.3s improvement" icon={Clock} trend="up" />
                </div>

                {/* Recent Activity */}
                <div className="glass-card">
                    <div className="flex items-center justify-between p-5 pb-0">
                        <h2 className="text-base font-bold text-foreground">
                            Recent Activity
                        </h2>

                        <Link
                            href="/history"
                            className="text-sm text-primary font-medium hover:underline"
                        >
                            View all
                        </Link>
                    </div>

                    <div className="p-5 space-y-0">
                        {recentActivity.map((item, i) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between py-3.5 border-b last:border-0 animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full ${dotColor[item.type]} flex-shrink-0`}
                                    />
                                    <span className="text-sm text-foreground">
                                        {item.text}
                                    </span>
                                </div>

                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                    {item.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        {
                            title: "Post a New Job",
                            desc: "Create a job listing and start receiving applicants",
                            link: "/jobs/create",
                            icon: Briefcase,
                        },
                        {
                            title: "Upload Applicants",
                            desc: "Import CVs, spreadsheets, or add candidates manually",
                            link: "/applicants",
                            icon: Users,
                        },
                        {
                            title: "View Results",
                            desc: "Check AI-ranked shortlists and screening reports",
                            link: "/results",
                            icon: Trophy,
                        },
                    ].map((action, i) => (
                        <Card key={action.title}>
                            <Link
                                key={action.title}
                                href={action.link}
                                className="glass-card p-6 group hover:border-primary/30 transition-all animate-fade-in"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                                    <action.icon className="w-5 h-5 text-accent-foreground" />
                                </div>

                                <h3 className="font-bold text-foreground">
                                    {action.title}
                                </h3>

                                <p className="text-sm text-muted-foreground mt-1">
                                    {action.desc}
                                </p>

                                <div className="flex items-center gap-1 mt-4 text-sm text-primary font-semibold group-hover:gap-2 transition-all">
                                    Get started <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}