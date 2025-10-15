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
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
        <p className="text-muted-foreground text-lg">Continue your recovery journey with strength and purpose</p>
      </div>

      <AbstinenceCounter startDate={startDate} />

      <Card className="border-primary/20 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <span className="text-3xl">💪</span>
            Daily Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <blockquote className="italic text-foreground/80 text-lg border-l-4 border-primary pl-4">
            "It is always the simple that produces the marvelous."
          </blockquote>
          <p className="text-right text-muted-foreground">- Amelia Barr</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path}>
                <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer border-primary/10">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className={`mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ${action.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="font-medium text-foreground">{action.label}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-6">
          <p className="text-center text-foreground/80 text-lg">
            "Trust is built with consistency."
          </p>
          <p className="text-center text-muted-foreground mt-2">- Lincoln Chafee</p>
        </CardContent>
      </Card>
    </div>
  );
}
