import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Home,
  Target,
  Bell,
  TrendingUp,
  Heart,
  ListChecks,
  MessageSquare,
  BookOpen,
  Smile,
  Wrench,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const menuItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Target, label: "Mi Plan", path: "/plan" },
  { icon: TrendingUp, label: "Progreso", path: "/progress" },
  { icon: Heart, label: "Valores", path: "/values" },
  { icon: Smile, label: "Diario de Emociones", path: "/emotion-journal" },
  { icon: BookOpen, label: "Diario", path: "/journal" },
  { icon: ListChecks, label: "Lista de Gratitud", path: "/gratitude" },
  { icon: MessageSquare, label: "Mensaje Diario", path: "/message" },
  { icon: Wrench, label: "Herramientas", path: "/tools" },
  { icon: Bell, label: "Recordatorios", path: "/reminders" },
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
      <Link to="/dashboard" className="mb-5 px-6 pt-5 block hover:opacity-80 transition-opacity" onClick={() => setOpen(false)}>
        <h1 className="text-2xl font-bold text-sidebar-foreground tracking-tight">Rehapp</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Tu camino hacia la recuperación</p>
      </Link>
      
      <nav className="flex flex-col gap-1.5 px-5 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-lg"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground font-medium"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className="p-5 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 font-medium"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Cerrar sesión</span>
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
