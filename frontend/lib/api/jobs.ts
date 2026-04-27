// lib/api/jobs.ts
// Typed API client for the Job endpoints

import { getToken } from "./auth";

// Strip trailing /api if present — the functions below already append /api/...
const _RAW_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const BASE = _RAW_BASE.endsWith("/api") ? _RAW_BASE.slice(0, -4) : _RAW_BASE;

export type ExperienceLevel = "junior" | "mid" | "senior" | "lead";
export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";
export type JobStatus = "open" | "closed";

export interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  minExperience: number;
  employmentType: EmploymentType;
  requirements: string[];
  location?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  minExperience: number;
  employmentType: EmploymentType;
  requirements: string[];
  location?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

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

export interface GetJobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getJobs(params?: {
  status?: JobStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<GetJobsResponse> {
  const url = new URL(`${BASE}/api/jobs`);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.page) url.searchParams.set("page", params.page.toString());
  if (params?.limit) url.searchParams.set("limit", params.limit.toString());

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  return handle<GetJobsResponse>(res);
}

export async function getJob(id: string): Promise<Job> {
  const res = await fetch(`${BASE}/api/jobs/${id}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  return handle<Job>(res);
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const res = await fetch(`${BASE}/api/jobs`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<Job>(res);
}

export async function updateJob(id: string, payload: Partial<CreateJobPayload>): Promise<Job> {
  const res = await fetch(`${BASE}/api/jobs/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return handle<Job>(res);
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/jobs/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handle<void>(res);
}
