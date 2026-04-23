import { z } from "zod";

const skillLevelSchema = z
  .preprocess((val) => val ?? "Intermediate", z.string())
  .transform((val) => {
    const v = val.toLowerCase();
    if (v.includes("expert")) return "Expert";
    if (v.includes("adv")) return "Advanced";
    if (v.includes("inter")) return "Intermediate";
    if (v.includes("beg")) return "Beginner";
    return "Intermediate";
  })
  .or(z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]))
  .default("Intermediate");

const languageProficiencySchema = z
  .preprocess((val) => val ?? "Conversational", z.string())
  .transform((val) => {
    const v = val.toLowerCase();
    if (v.includes("native")) return "Native";
    if (v.includes("fluent")) return "Fluent";
    if (v.includes("conv")) return "Conversational";
    if (v.includes("basic")) return "Basic";
    return "Conversational";
  })
  .or(z.enum(["Basic", "Conversational", "Fluent", "Native"]))
  .default("Conversational");

const availabilityStatusSchema = z
  .preprocess((val) => val ?? "Available", z.string())
  .transform((val) => {
    const v = val.toLowerCase();
    if (v.includes("open")) return "Open to Opportunities";
    if (v.includes("not")) return "Not Available";
    if (v.includes("available")) return "Available";
    return "Available";
  })
  .or(z.enum(["Available", "Open to Opportunities", "Not Available"]))
  .default("Available");

const availabilityTypeSchema = z
  .preprocess((val) => val ?? "Full-time", z.string())
  .transform((val) => {
    const v = val.toLowerCase();
    if (v.includes("full")) return "Full-time";
    if (v.includes("part")) return "Part-time";
    if (v.includes("contract")) return "Contract";
    return "Full-time";
  })
  .or(z.enum(["Full-time", "Part-time", "Contract"]))
  .default("Full-time");

export const applicantParseSchema = z
  .object({
    isResume: z.boolean().default(true),
    "First Name": z.string().nullable().transform(v => v ?? "Unknown").default("Unknown"),
    "Last Name": z.string().nullable().transform(v => v ?? "Applicant").default("Applicant"),
    "Email": z.string().email().or(z.string().transform(() => "unknown@example.com")),
    "Headline": z.string().nullable().transform(v => v ?? "Professional").default("Professional"),
    "Bio": z.string().nullable().default(null),
    "Location": z.string().nullable().transform(v => v ?? "Remote").default("Remote"),
    "Phone": z.string().nullable().default(null),

    skills: z.array(z.object({
      name: z.string().nullable().transform(v => v ?? "Skill"),
      level: skillLevelSchema,
      yearsOfExperience: z.preprocess((val) => (typeof val === 'string' ? parseInt(val) : val), z.number().nullable().default(null))
    })).default([]),

    languages: z.array(z.object({
      name: z.string().nullable().transform(v => v ?? "Language"),
      proficiency: languageProficiencySchema
    })).default([]),

    experience: z.array(z.object({
      company: z.string().nullable().transform(v => v ?? "Unknown"),
      role: z.string().nullable().transform(v => v ?? "Experience"),
      "Start Date": z. string().nullable().default(""),
      "End Date": z.string().nullable().default(""),
      description: z.string().nullable().default(null),
      technologies: z.array(z.string()).default([]),
      "Is Current": z.boolean().nullable().default(null)
    })).default([]),

    education: z.array(z.object({
      institution: z.string().nullable().transform(v => v ?? "University"),
      degree: z.string().nullable().transform(v => v ?? "Degree"),
      "Field of Study": z.string().nullable().default(null),
      "Start Year": z.preprocess((val) => (typeof val === 'string' ? parseInt(val) : val), z.number().int().nullable().default(null)),
      "End Year": z.preprocess((val) => (typeof val === 'string' ? parseInt(val) : val), z.number().int().nullable().default(null))
    })).default([]),

    certifications: z.array(z.object({
      name: z.string().nullable().transform(v => v ?? "Cert"),
      issuer: z.string().nullable().transform(v => v ?? "Issuer"),
      "Issue Date": z.string().nullable().default(null)
    })).default([]),

    projects: z.array(z.object({
      name: z.string().nullable().transform(v => v ?? "Project"),
      description: z.string().nullable().default(null),
      technologies: z.array(z.string()).default([]),
      role: z.string().nullable().default(null),
      link: z.string().nullable().default(null),
      "Start Date": z.string().nullable().default(null),
      "End Date": z.string().nullable().default(null)
    })).default([]),

    availability: z.object({
      status: availabilityStatusSchema,
      type: availabilityTypeSchema,
      "Start Date": z.string().nullable().default(null)
    }).default({ status: "Available", type: "Full-time", "Start Date": null }),

    socialLinks: z.object({
      linkedin: z.string().nullable().default(null),
      github: z.string().nullable().default(null),
      portfolio: z.string().nullable().default(null),
      twitter: z.string().nullable().default(null)
    }).default({ linkedin: null, github: null, portfolio: null, twitter: null }),

    matchScore: z.preprocess((val) => (typeof val === 'string' ? parseInt(val) : val), z.number().min(0).max(100).default(0)),
    recommendation: z.enum(["Highly Recommended", "Recommended", "Consider", "Not Recommended"]).default("Consider"),
    strengths: z.array(z.string()).default([]),
    gaps: z.array(z.string()).default([]),
    aiSummary: z.string().nullable().default(null),
  })
  .transform((data) => ({
    isResume: data.isResume,
    firstName: data["First Name"],
    lastName: data["Last Name"],
    email: data["Email"],
    headline: data["Headline"],
    bio: data["Bio"],
    location: data["Location"],
    phone: data["Phone"],
    skills: data.skills,
    languages: data.languages,
    experience: data.experience.map(e => ({
      company: e.company,
      role: e.role,
      startDate: e["Start Date"],
      endDate: e["End Date"],
      description: e.description,
      technologies: e.technologies,
      isCurrent: e["Is Current"]
    })),
    education: data.education.map(ed => ({
      institution: ed.institution,
      degree: ed.degree,
      fieldOfStudy: ed["Field of Study"],
      startYear: ed["Start Year"],
      endYear: ed["End Year"]
    })),
    certifications: data.certifications.map(c => ({
      name: c.name,
      issuer: c.issuer,
      issueDate: c["Issue Date"]
    })),
    projects: data.projects.map(p => ({
      name: p.name,
      description: p.description,
      technologies: p.technologies,
      role: p.role,
      link: p.link,
      startDate: p["Start Date"],
      endDate: p["End Date"]
    })),
    availability: {
      status: data.availability.status,
      type: data.availability.type,
      startDate: data.availability["Start Date"]
    },
    socialLinks: data.socialLinks,
    matchScore: data.matchScore,
    recommendation: data.recommendation,
    strengths: data.strengths,
    gaps: data.gaps,
    aiSummary: data.aiSummary
  }));

export type ParsedApplicant = z.infer<typeof applicantParseSchema>;
