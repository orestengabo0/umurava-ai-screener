import { z } from "zod";

const skillLevelSchema = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
]);

const languageProficiencySchema = z.enum([
  "Basic",
  "Conversational",
  "Fluent",
  "Native",
]);

const availabilityStatusSchema = z.enum([
  "Available",
  "Open to Opportunities",
  "Not Available",
]);

const availabilityTypeSchema = z.enum(["Full-time", "Part-time", "Contract"]);

export const applicantParseSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),

    headline: z.string().nullable(),
    bio: z.string().nullable(),
    location: z.string().nullable(),
    phone: z.string().nullable(),

    skills: z
      .array(
        z.object({
          name: z.string().min(1),
          level: skillLevelSchema,
          yearsOfExperience: z.number().nonnegative().nullable(),
        })
      )
      .default([]),

    languages: z
      .array(
        z.object({
          name: z.string().min(1),
          proficiency: languageProficiencySchema,
        })
      )
      .default([]),

    experience: z
      .array(
        z.object({
          company: z.string().min(1),
          role: z.string().min(1),
          startDate: z.string(),
          endDate: z.string(),
          description: z.string().nullable(),
          technologies: z.array(z.string()).default([]),
          isCurrent: z.boolean().nullable(),
        })
      )
      .default([]),

    education: z
      .array(
        z.object({
          institution: z.string().min(1),
          degree: z.string().min(1),
          fieldOfStudy: z.string().min(1),
          startYear: z.number().int(),
          endYear: z.number().int(),
        })
      )
      .default([]),

    certifications: z
      .array(
        z.object({
          name: z.string().min(1),
          issuer: z.string().min(1),
          issueDate: z.string().nullable(),
        })
      )
      .default([]),

    projects: z
      .array(
        z.object({
          name: z.string().min(1),
          description: z.string().nullable(),
          technologies: z.array(z.string()).default([]),
          role: z.string().nullable(),
          link: z.string().nullable(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
        })
      )
      .default([]),

    availability: z.object({
      status: availabilityStatusSchema,
      type: availabilityTypeSchema,
      startDate: z.string().nullable(),
    }),

    socialLinks: z.object({
      linkedin: z.string().nullable(),
      github: z.string().nullable(),
      portfolio: z.string().nullable(),
      twitter: z.string().nullable(),
    }),
  })
  .strict();

export type ParsedApplicant = z.infer<typeof applicantParseSchema>;
