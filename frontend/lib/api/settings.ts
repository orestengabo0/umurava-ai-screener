import { getToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Settings {
  geminiApiKey: string;
  geminiModel: string;
  isActive: boolean;
  lastTestedAt: string | null;
  lastTestSuccess: boolean | null;
}

export interface UpdateSettingsData {
  geminiApiKey?: string;
  geminiModel: string;
}

export interface TestSettingsData {
  geminiApiKey: string;
  geminiModel: string;
}

export async function getSettings(): Promise<Settings> {
  const token = getToken();
  const response = await fetch(`${API_BASE}/api/settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch settings");
  }

  return response.json();
}

export async function updateSettings(data: UpdateSettingsData): Promise<Settings> {
  const token = getToken();
  const response = await fetch(`${API_BASE}/api/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update settings");
  }

  return response.json();
}

export async function testSettings(data: TestSettingsData): Promise<{ success: boolean; message: string; error?: string }> {
  const token = getToken();
  const response = await fetch(`${API_BASE}/api/settings/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to test settings");
  }

  return response.json();
}

export async function testStoredSettings(): Promise<{ success: boolean; message: string; error?: string }> {
  const token = getToken();
  const response = await fetch(`${API_BASE}/api/settings/test-stored`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to test stored settings");
  }

  return response.json();
}

export async function deleteSettings(): Promise<void> {
  const token = getToken();
  const response = await fetch(`${API_BASE}/api/settings`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete settings");
  }
}
