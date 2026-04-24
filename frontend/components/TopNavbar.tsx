"use client";

import { Search, Menu, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

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
            <p className="text-[11px] font-bold text-foreground">
              {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
            </p>
            <p className="text-[8px] font-bold text-muted-foreground  tracking-widest">
              {user ? user.email : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">{initials}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
