import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
