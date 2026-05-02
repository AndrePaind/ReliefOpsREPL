import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  MapPin,
  Package,
  Truck,
  Users,
  Activity,
  Globe,
  UserCog,
  LogOut,
  Menu,
  Building2,
  ChevronDown,
  Settings,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrg } from "@/context/OrgContext";

const privateNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hubs", label: "Hubs & Stock", icon: MapPin },
  { href: "/requests", label: "Supply Requests", icon: Package },
  { href: "/transfers", label: "Transfers", icon: Truck },
  { href: "/volunteers", label: "Volunteers", icon: Users },
  { href: "/activity", label: "Activity Log", icon: Activity },
];

const communityNavItems = [
  { href: "/board", label: "Shared Board", icon: Globe },
];

const adminNavItems = [
  { href: "/team", label: "Team Management", icon: UserCog },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-orange-100 text-orange-700",
  Coordinator: "bg-blue-100 text-blue-700",
  Viewer: "bg-slate-100 text-slate-600",
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { org, allOrgs, switchOrg } = useOrg();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) =>
    location === href || location.startsWith(`${href}/`);

  const NavSection = ({ title, items }: { title?: string; items: typeof privateNavItems }) => (
    <div className="space-y-0.5">
      {title && <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{title}</p>}
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-sm ${active ? "bg-primary/10 text-primary font-semibold" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  const OrgSwitcher = () => {
    if (!org) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mx-3 mt-3 px-3 py-2 rounded-lg bg-orange-50 border border-orange-100 flex items-center gap-2 min-w-0 w-[calc(100%-1.5rem)] hover:bg-orange-100 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <p className="text-xs font-medium text-orange-700 truncate flex-1 text-left">{org.name}</p>
            {allOrgs.length > 1 && <ChevronDown className="w-3 h-3 text-orange-400 shrink-0" />}
          </button>
        </DropdownMenuTrigger>
        {allOrgs.length > 1 && (
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs text-slate-500">Switch mission</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allOrgs.map((o) => (
              <DropdownMenuItem key={o.id} onClick={() => switchOrg(o.id)} className="flex items-center gap-2 cursor-pointer">
                {o.id === org.id ? (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="flex-1 truncate text-sm">{o.name}</span>
                <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${ROLE_COLORS[o.myRole] ?? ""}`}>
                  {o.myRole}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    );
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 flex items-center gap-3 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <span className="text-base font-bold tracking-tight text-slate-900">ReliefOps</span>
          <p className="text-[11px] text-slate-400 truncate">Humanitarian Logistics</p>
        </div>
      </div>

      <OrgSwitcher />

      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3">
        <NavSection title="Operations" items={privateNavItems} />
        <NavSection title="Community" items={communityNavItems} />
        {(org?.myRole === "Admin" || org?.myRole === "Coordinator") && (
          <NavSection title="Management" items={adminNavItems} />
        )}
      </nav>

      <div className="p-3 border-t border-slate-100 shrink-0">
        <Link href="/settings">
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm mb-1 ${isActive("/settings") ? "bg-primary/10 text-primary font-semibold" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </div>
        </Link>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {user?.firstName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">{user?.fullName || user?.firstName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 shrink-0" onClick={() => signOut()}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-white h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0 flex flex-col">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="text-base font-bold tracking-tight">ReliefOps</span>
          {org && <span className="text-xs text-slate-400 truncate max-w-[120px]">{org.name}</span>}
        </div>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
            {user?.firstName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-slate-50/50">
        <div className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
