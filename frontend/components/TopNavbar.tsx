import { Bell, Search, User } from "lucide-react";

export function TopNavbar() {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search jobs, candidates..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">Sarah Chen</p>
            <p className="text-xs text-muted-foreground">Recruiter</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
