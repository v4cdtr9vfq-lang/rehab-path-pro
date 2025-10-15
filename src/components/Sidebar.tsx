import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Home,
  Target,
  Bell,
  ClipboardCheck,
  TrendingUp,
  Heart,
  ListChecks,
  MessageSquare,
  BookOpen,
  Wrench,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Target, label: "My Plan", path: "/plan" },
  { icon: Bell, label: "Reminders", path: "/reminders" },
  { icon: ClipboardCheck, label: "Daily Check-In", path: "/checkin" },
  { icon: TrendingUp, label: "Progress", path: "/progress" },
  { icon: Wrench, label: "Tools", path: "/tools" },
  { icon: Heart, label: "Values", path: "/values" },
  { icon: ListChecks, label: "Gratitude List", path: "/gratitude" },
  { icon: MessageSquare, label: "Daily Message", path: "/message" },
  { icon: BookOpen, label: "Journal", path: "/journal" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-2 p-6 flex-1">
        <div className="mb-8 px-2">
          <h1 className="text-3xl font-bold text-sidebar-foreground tracking-tight">RehabApp</h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1">Your recovery journey</p>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-lg"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground font-medium"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[15px]">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 w-full rounded-2xl px-4 py-3.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 font-medium mt-2"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[15px]">Cerrar sesión</span>
        </button>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-primary">RehabApp</h1>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar-background p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col bg-sidebar-background border-r border-sidebar-border">
        <SidebarContent />
      </aside>
    </>
  );
}
