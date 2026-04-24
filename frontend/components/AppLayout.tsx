"use client";

import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar - Fixed on desktop, drawer on mobile */}
      <AppSidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
      )}>
        <TopNavbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
