import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Menu, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [totalOnlineInChat, setTotalOnlineInChat] = useState(0);
  
  const menuItems = [{
    emoji: "🫀",
    label: t('navigation.dashboard'),
    path: "/dashboard",
    id: "dashboard-link"
  }, {
    emoji: "🎯",
    label: t('navigation.plan'),
    path: "/plan",
    id: "plan-link"
  }, {
    emoji: "📈",
    label: t('navigation.progress'),
    path: "/progress",
    id: "progress-link"
  }, {
    emoji: "😊",
    label: t('navigation.emotionJournal'),
    path: "/emotion-journal"
  }, {
    emoji: "📔",
    label: t('navigation.journal'),
    path: "/journal"
  }, {
    emoji: "🙏",
    label: t('navigation.gratitude'),
    path: "/gratitude"
  }, {
    emoji: "❤️",
    label: t('navigation.values'),
    path: "/values"
  }, {
    emoji: "💬",
    label: t('navigation.chat'),
    path: "/chat"
  }, {
    emoji: "🫶",
    label: t('navigation.community'),
    path: "/community",
    id: "community-link"
  }, {
    emoji: "🛠️",
    label: t('navigation.tools'),
    path: "/tools"
  }, {
    emoji: "🆘",
    label: t('navigation.help'),
    path: "/help"
  }, {
    emoji: "⚙️",
    label: t('navigation.settings'),
    path: "/settings"
  }];
  useEffect(() => {
    // Escuchar actualizaciones del contador de usuarios en chat
    const handleChatUsersUpdate = (event: CustomEvent) => {
      setTotalOnlineInChat(event.detail.totalUsers);
    };
    window.addEventListener('chatUsersUpdated', handleChatUsersUpdate as EventListener);
    return () => window.removeEventListener('chatUsersUpdated', handleChatUsersUpdate as EventListener);
  }, []);
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast.error(t('errors.genericError'));
      } else {
        toast.success(t('settings.logout'));
        // Force navigation and reload
        window.location.href = "/auth?mode=login";
      }
    } catch (err) {
      console.error('Unexpected logout error:', err);
      toast.error("Error inesperado al cerrar sesión");
    }
  };
  const SidebarContent = () => <div className="flex flex-col h-full">
      <Link to="/dashboard" className="mb-5 px-6 pt-5 block hover:opacity-80 transition-opacity" onClick={() => setOpen(false)}>
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-sidebar-foreground tracking-tight">rehabp.org</h1>
        </div>
        <p className="text-xs text-sidebar-foreground/60 mt-1">{t('sidebar.tagline')}</p>
      </Link>
      
      <nav className="flex flex-col gap-1.5 px-5 flex-1 overflow-y-auto sidebar-nav">
        {menuItems.map(item => {
        // "Mi centro" también incluye /checkin
        const isActive = location.pathname === item.path || item.path === '/dashboard' && location.pathname === '/checkin';
        const isChat = item.path === '/chat';
        // ID para el tour de onboarding
        const getLinkId = () => {
          if (item.path === '/dashboard') return 'dashboard-link';
          if (item.path === '/plan') return 'plan-link';
          if (item.path === '/progress') return 'progress-link';
          if (item.path === '/community') return 'community-link';
          return undefined;
        };
        return <Link 
          key={item.path} 
          to={item.path} 
          id={getLinkId()}
          onClick={() => setOpen(false)} 
          className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${isActive ? "bg-primary text-primary-foreground font-semibold" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground font-medium"}`}>
              <span className="text-lg flex-shrink-0">{item.emoji}</span>
              <span className="text-base flex-1">{item.label}</span>
              {isChat && <Badge variant="secondary" className="ml-auto text-xs px-2 py-1 flex items-center justify-center min-w-[24px] h-[24px]">
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
            <span className="text-base">Salir</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>;
  return <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-primary">rehabp.org</h1>
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