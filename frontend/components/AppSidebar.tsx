"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
];

export function AppSidebar({ 
  mobileOpen, 
  setMobileOpen 
}: { 
  mobileOpen: boolean; 
  setMobileOpen: (open: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 lg:relative lg:translate-x-0",
        collapsed ? "w-[80px]" : "w-[280px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-black text-sm">U</span>
          </div>

          {!collapsed && (
            <span className="font-black text-base text-foreground tracking-tighter">
              UMURAVA<span className="text-primary">.</span>
            </span>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden rounded-md"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 px-2 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {!collapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.1em] mb-2">Core Menu</p>}
          {navItems.map((item) => {
            const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));

            return (
              <Link
                key={item.title}
                href={item.url}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>

      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border bg-accent/10">
        {!collapsed ? (
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-md py-2 h-9 hover:bg-destructive/10 hover:text-destructive group">
            <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
            <span className="text-xs font-semibold">Sign Out</span>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="w-full h-9 rounded-md">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Collapse toggle (Desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 rounded-md bg-card border shadow-sm items-center justify-center text-muted-foreground hover:text-primary transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}