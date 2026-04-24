"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/AppLayout";
import { getSettings, updateSettings, testSettings, testStoredSettings, deleteSettings, type Settings } from "@/lib/api/settings";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    geminiApiKey: "",
    geminiModel: "gemini-2.5-flash-lite",
    isActive: false,
    lastTestedAt: null,
    lastTestSuccess: null,
  });
  const [formData, setFormData] = useState({
    geminiApiKey: "",
    geminiModel: "gemini-2.5-flash-lite",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      setFormData({
        geminiApiKey: "", // Don't populate with masked key from backend
        geminiModel: data.geminiModel,
      });
    } catch (error) {
      toast.error("Failed to load settings", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = await updateSettings(formData);
      setSettings(data);
      setFormData({
        geminiApiKey: "", // Clear the input after saving
        geminiModel: data.geminiModel,
      });
      toast.success("Settings saved", {
        description: "Your Gemini API configuration has been updated.",
      });
    } catch (error) {
      toast.error("Failed to save settings", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testStoredSettings();
      
      if (result.success) {
        toast.success("API key is valid", {
          description: result.message,
        });
        // Reload settings to get updated test status
        await loadSettings();
      } else {
        toast.error("API key test failed", {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error("Test failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your API key? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteSettings();
      setSettings({
        geminiApiKey: "",
        geminiModel: "gemini-2.5-flash-lite",
        isActive: false,
        lastTestedAt: null,
        lastTestSuccess: null,
      });
      setFormData({
        geminiApiKey: "",
        geminiModel: "gemini-2.5-flash-lite",
      });
      toast.success("Settings deleted", {
        description: "Your API key has been removed.",
      });
    } catch (error) {
      toast.error("Failed to delete settings", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className=" space-y-6 px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your Gemini API key and model preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gemini API Configuration</CardTitle>
            <CardDescription>
              Enter your Google Gemini API key to enable AI-powered resume screening
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key Input */}
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                API Key
              </label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder={settings.geminiApiKey ? "API key is saved (enter new key to update)" : "Enter your Gemini API key"}
                  value={formData.geminiApiKey}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label htmlFor="model" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Model
              </label>
              <Select
                value={formData.geminiModel}
                onValueChange={(value) => setFormData({ ...formData, geminiModel: value })}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</SelectItem>
                  <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                  <SelectItem value="gemini-2.5-pro">gemini-2.5-pro</SelectItem>
                  <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                  <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the Gemini model to use for AI processing
              </p>
            </div>

            {/* Status Indicator */}
            {settings.lastTestedAt && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-accent/50">
                {settings.lastTestSuccess ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {settings.lastTestSuccess ? "API key is working" : "API key test failed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last tested: {new Date(settings.lastTestedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.geminiApiKey}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
              <Button
                onClick={handleTest}
                disabled={isTesting || !settings.geminiApiKey}
                variant="outline"
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Saved Key"
                )}
              </Button>
            </div>

            {settings.geminiApiKey && (
              <Button
                onClick={handleDelete}
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Delete API Key
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              About Gemini API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The Gemini API is used to analyze resumes and match candidates to job requirements using AI.
            </p>
            <p>
              Your API key is stored securely in our database and is only used for your account.
            </p>
            <p>
              If you exceed your API quota, you'll be prompted to update your API key or switch to a different model.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
