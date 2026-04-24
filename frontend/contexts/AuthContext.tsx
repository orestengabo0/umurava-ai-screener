"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { login, register, forgotPassword, resetPassword, setToken, setUserInfo, removeToken, removeUserInfo, getToken, getUserInfo, type LoginData, type RegisterData, type ForgotPasswordData, type ResetPasswordData, type AuthResponse } from "@/lib/api/auth";
import { toast } from "sonner";

interface AuthContextType {
  user: AuthResponse["user"] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      const token = getToken();
      const userInfo = getUserInfo();
      
      if (token && userInfo) {
        setUser(userInfo);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = useCallback(async (data: LoginData) => {
    try {
      const response = await login(data);
      setToken(response.token);
      setUserInfo(response.user);
      setUser(response.user);
      toast.success("Welcome back!", {
        description: "You have been successfully logged in.",
      });
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  }, [router]);

  const handleRegister = useCallback(async (data: RegisterData) => {
    try {
      const response = await register(data);
      setToken(response.token);
      setUserInfo(response.user);
      setUser(response.user);
      toast.success("Account created!", {
        description: "Welcome to Umurava AI Screener.",
      });
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  }, [router]);

  const handleLogout = useCallback(() => {
    removeToken();
    removeUserInfo();
    setUser(null);
    toast.success("Logged out", {
      description: "You have been successfully logged out.",
    });
    router.push("/");
  }, [router]);

  const handleForgotPassword = useCallback(async (data: ForgotPasswordData) => {
    try {
      await forgotPassword(data);
      toast.success("Reset link sent", {
        description: "Check your email for the password reset link.",
      });
    } catch (error) {
      throw error;
    }
  }, []);

  const handleResetPassword = useCallback(async (data: ResetPasswordData) => {
    try {
      await resetPassword(data);
      toast.success("Password reset successful", {
        description: "You can now log in with your new password.",
      });
    } catch (error) {
      throw error;
    }
  }, []);

  const refreshUser = useCallback(() => {
    const userInfo = getUserInfo();
    setUser(userInfo);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
