// lib/api/jobs.ts
// Typed API client for the Job endpoints

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";
export type JobStatus = "open" | "closed";

export interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel?: ExperienceLevel;
  location?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel?: ExperienceLevel;
  location?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { message?: string }).message ?? res.statusText;
    throw new Error(msg);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── API functions ──────────────────────────────────────────────────────────────

export async function getJobs(status?: JobStatus): Promise<Job[]> {
  const url = new URL(`${BASE}/api/jobs`);
  if (status) url.searchParams.set("status", status);
  const res = await fetch(url.toString(), { cache: "no-store" });
  return handle<Job[]>(res);
}

export async function getJob(id: string): Promise<Job> {
  const res = await fetch(`${BASE}/api/jobs/${id}`, { cache: "no-store" });
  return handle<Job>(res);
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const res = await fetch(`${BASE}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<Job>(res);
}

export async function setJobStatus(
  id: string,
  status: JobStatus
): Promise<Job> {
  const res = await fetch(`${BASE}/api/jobs/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handle<Job>(res);
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/jobs/${id}`, { method: "DELETE" });
  return handle<void>(res);
}
