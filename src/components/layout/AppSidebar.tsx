import { NavLink, useLocation } from "react-router-dom";
import {
  Shield,
  Target,
  Play,
  FileText,
  Box,
  Bot,
  ScrollText,
  Settings,
  Info,
  Home,
  Lock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Targets", url: "/targets", icon: Target },
  { title: "Tools", url: "/tools", icon: Shield },
  { title: "Scans", url: "/scans", icon: Play },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Sandbox", url: "/sandbox", icon: Box },
  { title: "AI Assistant", url: "/ai", icon: Bot },
  { title: "Encryption Test", url: "/test/encryption", icon: Lock },
  { title: "Logs", url: "/logs", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "About", url: "/about", icon: Info },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        {open && (
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">P.R.I.S.M.</h1>
            <p className="text-xs text-muted-foreground">Pentesting Suite</p>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="p-4 border-t border-sidebar-border">
        <SidebarTrigger />
      </div>
    </Sidebar>
  );
}
