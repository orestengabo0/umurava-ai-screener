"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive"
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
        <DialogPrimitive.Content 
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-md border bg-card p-4 shadow-xl animate-in zoom-in-95 fade-in duration-200",
          )}
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-1.5 rounded-md",
                variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <DialogPrimitive.Title className="text-base font-bold tracking-tight">
                {title}
              </DialogPrimitive.Title>
            </div>
            
            <DialogPrimitive.Description className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              {description}
            </DialogPrimitive.Description>
 
            <div className="flex items-center justify-end gap-2 mt-1">
              <Button 
                variant="ghost" 
                className="rounded-md px-3 h-8 text-[11px]"
                onClick={onClose}
              >
                {cancelText}
              </Button>
              <Button 
                variant={variant === "destructive" ? "destructive" : "default"}
                className="rounded-md px-4 h-8 text-[11px] font-bold"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmText}
              </Button>
            </div>
          </div>
 
          <DialogPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 hover:bg-accent">
            <X className="w-3.5 h-3.5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
