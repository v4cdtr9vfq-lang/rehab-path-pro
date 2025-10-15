import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const menuItems = [
  { icon: Home, label: "Home", path: "/" },
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
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <nav className="flex flex-col gap-2 p-6">
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
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground font-medium"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[15px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
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
