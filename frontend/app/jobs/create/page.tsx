"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/AppLayout";
import { createJob, type ExperienceLevel } from "@/lib/api/jobs";
import { toast } from "sonner";

const DEFAULT_SKILLS = [
  "React", "TypeScript", "Python", "Node.js", "AWS", "Docker", "SQL", "GraphQL", "Figma", "Java", "Go"
];

export default function CreateJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [location, setLocation] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = (e?: React.FormEvent) => {
    e?.preventDefault();
    const skill = customSkill.trim();
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills(prev => [...prev, skill]);
      setCustomSkill("");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Job title and description are required.");
      return;
    }
    setLoading(true);
    try {
      const job = await createJob({
        title: title.trim(),
        description: description.trim(),
        requiredSkills: selectedSkills,
        experienceLevel: experienceLevel || undefined,
        location: location.trim() || undefined,
      });
      toast.success("Job created successfully");
      router.push(`/jobs/${job._id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-md h-8 w-8 hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Post New Job</h1>
            <p className="text-muted-foreground mt-0.5 text-[10px] font-bold uppercase tracking-wider">
              Find the perfect talent for your team.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="space-y-4">
          <div className="bg-card border rounded-md p-5 shadow-sm space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                Job Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-3 h-10 rounded-md border bg-accent/5 focus:bg-background transition-all outline-none font-semibold text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe role requirements and responsibilities..."
                className="w-full px-3 py-2.5 rounded-md border bg-accent/5 focus:bg-background transition-all outline-none resize-none text-xs font-medium"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Skills & Stack</label>
              
              <form onSubmit={addCustomSkill} className="flex gap-1.5 max-w-sm">
                <input 
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Type a skill..."
                  className="flex-1 px-3 h-8 rounded-md border bg-accent/5 text-[11px] focus:ring-1 focus:ring-primary/20 outline-none"
                />
                <Button type="submit" variant="secondary" size="icon" className="rounded-md h-8 w-8">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </form>

              <div className="flex flex-wrap gap-1 pt-1">
                {DEFAULT_SKILLS.concat(selectedSkills.filter(s => !DEFAULT_SKILLS.includes(s))).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "px-2 py-1 rounded-sm text-[10px] font-bold transition-all border flex items-center gap-1.5",
                      selectedSkills.includes(skill)
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : "bg-background border-input text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {skill}
                    {selectedSkills.includes(skill) && <X className="w-2.5 h-2.5 opacity-60" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Experience</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel | "")}
                  className="w-full px-3 h-10 rounded-md border bg-accent/5 appearance-none focus:bg-background transition-all outline-none font-semibold cursor-pointer text-xs"
                >
                  <option value="">Select Level</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Staff</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote / Kigali"
                  className="w-full px-3 h-10 rounded-md border bg-accent/5 focus:bg-background transition-all outline-none font-semibold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 py-2">
            <Button
              variant="ghost"
              className="rounded-md px-4 h-9 text-xs font-bold"
              onClick={() => router.back()}
              disabled={loading}
            >
              Discard
            </Button>
            <Button
              className="rounded-md px-6 h-9 font-bold gap-2 text-xs"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {loading ? "Publishing..." : "Publish Job"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}