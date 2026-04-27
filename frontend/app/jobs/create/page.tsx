"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/AppLayout";
import { createJob, type ExperienceLevel } from "@/lib/api/jobs";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_SKILLS = [
  "React", "TypeScript", "Python", "Node.js", "AWS", "Docker", "SQL", "GraphQL", "Figma", "Java", "Go"
];

export default function CreateJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [minExperience, setMinExperience] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState("");
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
    if (!experienceLevel) {
      toast.error("Experience level is required.");
      return;
    }
    if (!minExperience || isNaN(Number(minExperience)) || Number(minExperience) < 0) {
      toast.error("Minimum experience must be a valid number.");
      return;
    }
    if (!employmentType) {
      toast.error("Employment type is required.");
      return;
    }
    if (requirements.length === 0) {
      toast.error("Please add at least one requirement.");
      return;
    }
    setLoading(true);
    try {
      const job = await createJob({
        title: title.trim(),
        description: description.trim(),
        requiredSkills: selectedSkills,
        experienceLevel: experienceLevel as ExperienceLevel,
        minExperience: Number(minExperience),
        employmentType: employmentType as any,
        requirements,
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
      <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-background">
        {/* Header */}
        <div className="px-4 py-2.5 border-b bg-card flex items-center justify-between shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="p-1.5 rounded-md h-8 w-8 hover:bg-accent flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-none flex items-center gap-2 truncate">Post New Job</h1>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider truncate">
                Find the perfect talent for your team.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              className="rounded-md px-3 h-8 text-[10px] font-bold hidden sm:flex"
              onClick={() => router.back()}
              disabled={loading}
            >
              Discard
            </Button>
            <Button
              className="rounded-md px-4 h-8 font-bold gap-1.5 text-[10px]"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {loading ? "Publishing..." : "Publish Job"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 pb-24">
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
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Skills & Stack <span className="text-muted-foreground font-normal text-[9px]">(optional)</span></label>

                <form onSubmit={addCustomSkill} className="flex gap-1.5 max-w-sm">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Type a skill..."
                    maxLength={150}
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
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Experience Level <span className="text-destructive">*</span></label>
                  <Select value={experienceLevel} onValueChange={(val: any) => setExperienceLevel(val)}>
                    <SelectTrigger className="w-full px-3 h-10 rounded-md border bg-accent/5 transition-all font-semibold text-xs text-foreground">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Min Experience (Years) <span className="text-destructive">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full px-3 h-10 rounded-md border bg-accent/5 focus:bg-background transition-all outline-none font-semibold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Employment Type <span className="text-destructive">*</span></label>
                  <Select value={employmentType} onValueChange={setEmploymentType}>
                    <SelectTrigger className="w-full px-3 h-10 rounded-md border bg-accent/5 transition-all font-semibold text-xs text-foreground">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
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

              {/* Requirements */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Requirements <span className="text-destructive">*</span></label>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const req = currentRequirement.trim();
                  if (req && !requirements.includes(req) && req.length <= 300) {
                    setRequirements(prev => [...prev, req]);
                    setCurrentRequirement("");
                  }
                }} className="flex gap-1.5">
                  <input
                    type="text"
                    value={currentRequirement}
                    onChange={(e) => setCurrentRequirement(e.target.value)}
                    placeholder="Add a requirement..."
                    maxLength={300}
                    className="flex-1 px-3 h-8 rounded-md border bg-accent/5 text-[11px] focus:ring-1 focus:ring-primary/20 outline-none"
                  />
                  <Button type="submit" variant="secondary" size="icon" className="rounded-md h-8 w-8">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </form>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-bold bg-primary border border-primary text-primary-foreground shadow-sm">
                      <span className="line-clamp-1">{req}</span>
                      <button
                        type="button"
                        onClick={() => setRequirements(prev => prev.filter((_, i) => i !== idx))}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {requirements.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">{requirements.length} requirement{requirements.length !== 1 ? 's' : ''} added</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}