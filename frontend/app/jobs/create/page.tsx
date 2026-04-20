"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/AppLayout";

const skillOptions = [
  "React",
  "TypeScript",
  "Python",
  "Node.js",
  "AWS",
  "Docker",
  "SQL",
  "GraphQL",
  "Figma",
  "Java",
  "Go",
  "Kubernetes",
];

export default function CreateJobPage() {
  const router = useRouter();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  return (
    <AppLayout>
      <div className="page-container space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="mt-1.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Job</h1>
            <p className="text-muted-foreground mt-1">
              Set up a new job posting to start receiving applicants
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="border rounded-2xl bg-card p-8 space-y-8 shadow-sm">
          {/* Job Title */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              Job Title
            </label>
            <input
              type="text"
              placeholder="e.g. Senior React Developer"
              className="w-full px-4 py-3 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              Job Description
            </label>
            <textarea
              rows={5}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              className="w-full px-4 py-3 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-shadow"
            />
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              Required Skills
            </label>

            <div className="flex flex-wrap gap-2">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    selectedSkills.includes(skill)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Experience + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                Experience Level
              </label>

              <select className="w-full px-4 py-3 rounded-xl border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow appearance-none">
                <option value="">Select level</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior (5-8 years)</option>
                <option value="lead">Lead / Staff (8+ years)</option>
                <option value="executive">Executive / Director</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                Location
              </label>

              <input
                type="text"
                placeholder="e.g. Remote, New York"
                className="w-full px-4 py-3 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end pt-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl px-6 h-11"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            <Button
              className="gap-2 rounded-xl px-6 h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/applicants")}
            >
              <Save className="w-4 h-4" />
              Save & Analyze Candidates
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}