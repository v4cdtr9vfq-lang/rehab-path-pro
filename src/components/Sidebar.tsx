import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
const menuItems = [{
  emoji: "❤️",
  label: "Mi centro",
  path: "/dashboard"
}, {
  emoji: "🎯",
  label: "Mi Plan",
  path: "/plan"
}, {
  emoji: "📈",
  label: "Progreso",
  path: "/progress"
}, {
  emoji: "😊",
  label: "Diario de Emociones",
  path: "/emotion-journal"
}, {
  emoji: "📔",
  label: "Diario",
  path: "/journal"
}, {
  emoji: "🙏",
  label: "Lista de Gratitud",
  path: "/gratitude"
}, {
  emoji: "💝",
  label: "Valores",
  path: "/values"
}, {
  emoji: "💬",
  label: "Chat",
  path: "/chat"
}, {
  emoji: "🛠️",
  label: "Herramientas",
  path: "/tools"
}, {
  emoji: "🔔",
  label: "Recordatorios",
  path: "/reminders"
}, {
  emoji: "⚙️",
  label: "Configuración",
  path: "/settings"
}];
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [totalOnlineInChat, setTotalOnlineInChat] = useState(0);
  useEffect(() => {
    // Escuchar actualizaciones del contador de usuarios en chat
    const handleChatUsersUpdate = (event: CustomEvent) => {
      setTotalOnlineInChat(event.detail.totalUsers);
    };
    window.addEventListener('chatUsersUpdated', handleChatUsersUpdate as EventListener);
    return () => window.removeEventListener('chatUsersUpdated', handleChatUsersUpdate as EventListener);
  }, []);
  const handleLogout = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/");
    }
  };
  const SidebarContent = () => <div className="flex flex-col h-full">
      <Link to="/dashboard" className="mb-5 px-6 pt-5 block hover:opacity-80 transition-opacity" onClick={() => setOpen(false)}>
        <h1 className="text-2xl font-bold text-sidebar-foreground tracking-tight">Rehapp</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Tu proceso hacia la reconexión.</p>
      </Link>
      
      <nav className="flex flex-col gap-1.5 px-5 flex-1 overflow-y-auto">
        {menuItems.map(item => {
        // "Mi centro" también incluye /checkin
        const isActive = location.pathname === item.path || item.path === '/dashboard' && location.pathname === '/checkin';
        const isChat = item.path === '/chat';
        return <Link key={item.path} to={item.path} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${isActive ? "bg-primary text-primary-foreground font-semibold shadow-lg" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground font-medium"}`}>
              <span className="text-lg flex-shrink-0">{item.emoji}</span>
              <span className="text-sm flex-1">{item.label}</span>
              {isChat && <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
                  {totalOnlineInChat}
                </Badge>}
            </Link>;
      })}
      </nav>

      {/* Logout Button and Theme Toggle - Fixed at bottom */}
      <div className="p-5 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 font-medium">
            <span className="text-lg flex-shrink-0">🫥</span>
            <span className="text-sm">Salir</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>;
  return <>
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
    </>;
}