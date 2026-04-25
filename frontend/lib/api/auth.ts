const _RAW_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const API_BASE = _RAW_BASE.endsWith("/api") ? _RAW_BASE.slice(0, -4) : _RAW_BASE;

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  token: string;
}

export interface User {
  userId: string;
  email: string;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  return response.json();
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }

  return response.json();
}

export async function forgotPassword(data: ForgotPasswordData): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send reset email");
  }
}

export async function resetPassword(data: ResetPasswordData): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reset password");
  }
}

export async function getMe(token: string): Promise<{ user: User }> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info");
  }

  return response.json();
}

// Token management
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

export function setUserInfo(user: AuthResponse["user"]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user_info", JSON.stringify(user));
  }
}

export function getUserInfo(): AuthResponse["user"] | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("user_info");
    return stored ? JSON.parse(stored) : null;
  }
  return null;
}

export function removeUserInfo(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user_info");
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
