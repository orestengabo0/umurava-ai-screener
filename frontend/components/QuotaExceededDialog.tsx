"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

interface QuotaExceededDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuotaExceededDialog({ open, onOpenChange }: QuotaExceededDialogProps) {
  const router = useRouter();

  const handleGoToSettings = () => {
    onOpenChange(false);
    router.push("/settings");
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle>API Quota Exceeded</DialogTitle>
              <DialogDescription>
                You have reached your Gemini API quota limit
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Your current API key has reached its usage limit. To continue using AI-powered screening, you can:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Add a new API key in Settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Switch to a different Gemini model</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Wait for your quota to reset</span>
            </li>
          </ul>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleGoToSettings}>
            Go to Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
