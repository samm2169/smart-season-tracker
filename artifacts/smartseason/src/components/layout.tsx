import { Link, useLocation } from "wouter";
import { Show, useClerk } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { 
  Leaf, LayoutDashboard, Map, Users, LogOut, Loader2, Menu 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { data: user, isLoading } = useGetMe();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Fields", href: "/fields", icon: Map },
    ...(user?.role === "admin" ? [{ name: "Users", href: "/users", icon: Users }] : []),
  ];

  const handleSignOut = () => {
    signOut();
  };

  const NavLinks = () => (
    <div className="flex flex-col gap-2">
      {navigation.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.name} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </div>
          </Link>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar px-4 py-6">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">SmartSeason</span>
        </div>
        
        <nav className="flex-1">
          <NavLinks />
        </nav>

        <div className="pt-6 border-t border-sidebar-border mt-auto">
          <div className="px-3 mb-4">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between h-16 px-4 border-b bg-background">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">SmartSeason</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-6 bg-sidebar border-sidebar-border">
              <nav className="mt-8 flex-1">
                <NavLinks />
              </nav>
              <div className="mt-auto pt-6 border-t border-sidebar-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground" 
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
