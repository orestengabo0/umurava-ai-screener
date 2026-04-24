"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowRight, CheckCircle, UserPlus, Lock, Mail, ArrowLeft } from "lucide-react";

type AuthView = "login" | "register" | "forgot-password" | "reset-password" | "email-sent" | "reset-success";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, forgotPassword, resetPassword, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check for reset token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
      setView("reset-password");
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const scrollToForm = () => {
    const formElement = document.getElementById("auth-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      await login(data);
    } catch (error) {
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "Please check your credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      await register(data);
    } catch (error) {
      toast.error("Registration failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
    };

    try {
      await forgotPassword(data);
      setView("email-sent");
    } catch (error) {
      toast.error("Failed to send reset link", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      token: resetToken || "",
      newPassword: formData.get("newPassword") as string,
    };

    if (formData.get("newPassword") !== formData.get("confirmPassword")) {
      toast.error("Passwords do not match", {
        description: "Please make sure both passwords are the same.",
      });
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(data);
      setView("reset-success");
    } catch (error) {
      toast.error("Failed to reset password", {
        description: error instanceof Error ? error.message : "The link may have expired.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile CTA Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          onClick={() => {
            setView("login");
            scrollToForm();
          }}
          className="shadow-lg"
          size="sm"
        >
          Sign In
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-0 lg:min-h-screen lg:flex lg:items-center lg:justify-center">
        <div className="w-full max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left Side - Marketing Content */}
          <div className="space-y-6 lg:pr-8 mb-8 lg:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Umurava AI</h1>
            </div>

            <h2 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
              Transform Your Hiring with{" "}
              <span className="text-primary">AI-Powered</span> Screening
            </h2>

            <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
              Streamline your recruitment process with intelligent candidate analysis,
              automated resume parsing, and data-driven hiring decisions.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">AI-Powered Analysis</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Advanced algorithms analyze resumes and match candidates to job requirements
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Smart Ranking System</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Automatically rank candidates based on skills, experience, and fit
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Time-Saving Automation</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Reduce screening time by up to 80% with automated workflows
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div id="auth-form" className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md shadow-lg border-0">
              {view === "login" && (
                <>
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                      Sign in to your account to continue
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor="password" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => setView("forgot-password")}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-10 text-sm font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <p className="text-sm text-muted-foreground">
                          Don't have an account?{" "}
                          <button
                            type="button"
                            onClick={() => setView("register")}
                            className="text-primary font-semibold hover:underline"
                          >
                            Sign up
                          </button>
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              {view === "register" && (
                <>
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                      Join thousands of recruiters using AI-powered screening
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label htmlFor="firstName" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            First Name
                          </label>
                          <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            placeholder="John"
                            required
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="lastName" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Last Name
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            placeholder="Doe"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Password
                        </label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          minLength={6}
                          disabled={isLoading}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Must be at least 6 characters
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-10 text-sm font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <p className="text-sm text-muted-foreground">
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={() => setView("login")}
                            className="text-primary font-semibold hover:underline"
                          >
                            Sign in
                          </button>
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              {view === "forgot-password" && (
                <>
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                      Enter your email to receive a password reset link
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-10 text-sm font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setView("login")}
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to login
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              {view === "email-sent" && (
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        We've sent a password reset link to your email.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        The link will expire in 1 hour.
                      </p>
                    </div>
                    <div className="space-y-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setView("forgot-password")}
                        className="w-full h-10 text-sm font-semibold"
                      >
                        Try another email
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setView("login")}
                        className="w-full h-10 text-sm font-semibold"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to login
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}

              {view === "reset-password" && (
                <>
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      Reset Password
                    </CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                      Enter your new password below
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          New Password
                        </label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          placeholder="••••••••"
                          required
                          minLength={6}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Confirm Password
                        </label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          required
                          minLength={6}
                          disabled={isLoading}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-10 text-sm font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setView("login")}
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to login
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              {view === "reset-success" && (
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Password Reset Successful</h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        Your password has been successfully reset. You can now log in with your new password.
                      </p>
                    </div>
                    <Button
                      onClick={() => setView("login")}
                      className="w-full h-10 text-sm font-semibold"
                    >
                      Go to Login
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
