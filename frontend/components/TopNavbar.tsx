"use client";

import { Search, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 sm:px-5 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden rounded-md h-8 w-8"
          onClick={onMenuClick}
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-3 flex-1 max-w-xs hidden sm:flex">
          <div className="relative w-full group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-3 rounded-md bg-accent/20 border-none text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pl-3 border-l">
          <div className="text-right hidden md:block">
            <p className="text-[11px] font-bold text-foreground">Sarah Chen</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Admin</p>
          </div>
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
