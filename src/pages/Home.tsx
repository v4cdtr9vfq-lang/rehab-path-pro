import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, ClipboardCheck, TrendingUp, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  // Demo start date - in real app this would come from user settings
  const startDate = new Date("2021-01-22");

  const quickActions = [
    { icon: Target, label: "My Plan", path: "/plan", color: "text-primary" },
    { icon: ClipboardCheck, label: "Daily Check-In", path: "/checkin", color: "text-accent" },
    { icon: TrendingUp, label: "Progress", path: "/progress", color: "text-primary" },
    { icon: Heart, label: "Values", path: "/values", color: "text-accent" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm mb-2">Hello there,</p>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight">Your recovery<br />journey continues</h1>
      </div>

      <AbstinenceCounter startDate={startDate} />

      <Card className="bg-gradient-to-br from-primary via-primary to-primary-glow border-0">
        <CardHeader>
          <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wide">Daily Inspiration</p>
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary-foreground leading-tight">
            It is always the simple that produces the marvelous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-primary-foreground/90 text-base">- Amelia Barr</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-3xl font-bold mb-6 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path}>
                <Card className="hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center ${action.color}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">{action.label}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-8">
          <p className="text-center text-foreground text-xl font-medium leading-relaxed">
            "Trust is built with consistency."
          </p>
          <p className="text-center text-muted-foreground mt-4 text-base">- Lincoln Chafee</p>
        </CardContent>
      </Card>
    </div>
  );
}
