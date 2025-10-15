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
  { icon: Home, label: "Panel", path: "/dashboard" },
  { icon: Target, label: "Mi Plan", path: "/plan" },
  { icon: Bell, label: "Recordatorios", path: "/reminders" },
  { icon: ClipboardCheck, label: "Check-In Diario", path: "/checkin" },
  { icon: TrendingUp, label: "Progreso", path: "/progress" },
  { icon: Wrench, label: "Herramientas", path: "/tools" },
  { icon: Heart, label: "Valores", path: "/values" },
  { icon: ListChecks, label: "Lista de Gratitud", path: "/gratitude" },
  { icon: MessageSquare, label: "Mensaje Diario", path: "/message" },
  { icon: BookOpen, label: "Diario", path: "/journal" },
  { icon: Settings, label: "Configuración", path: "/settings" },
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
      <Link to="/dashboard" className="mb-8 px-8 pt-6 block hover:opacity-80 transition-opacity" onClick={() => setOpen(false)}>
        <h1 className="text-3xl font-bold text-sidebar-foreground tracking-tight">Rehapp</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">Tu camino hacia la recuperación</p>
      </Link>
      
      <nav className="flex flex-col gap-2 px-6 flex-1 overflow-y-auto">
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
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className="p-6 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 w-full rounded-2xl px-4 py-3.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[15px]">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" onClick={() => setOpen(false)}>
            <h1 className="text-xl font-bold text-primary">Rehapp</h1>
          </Link>
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
