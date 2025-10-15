import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";

interface ProgressArea {
  name: string;
  percentage: number;
  color: string;
}

export default function ProgressPage() {
  const areas: ProgressArea[] = [
    { name: "Recovery Engagement", percentage: 85, color: "bg-primary" },
    { name: "Physical", percentage: 70, color: "bg-primary" },
    { name: "Emotional", percentage: 60, color: "bg-primary" },
    { name: "Relationships", percentage: 75, color: "bg-primary" },
    { name: "Practical", percentage: 80, color: "bg-primary" },
    { name: "Spiritual", percentage: 65, color: "bg-accent" },
  ];

  const ProgressBar = ({ area }: { area: ProgressArea }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{area.name}</span>
        <span className="text-sm font-bold text-primary">{area.percentage}%</span>
      </div>
      <Progress value={area.percentage} className="h-2" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Progress</h1>
        <p className="text-muted-foreground text-lg">Track your recovery journey across different areas</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-primary/20 bg-card">
              <span className="text-4xl font-bold text-primary">75%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Total Goal Completion</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">Current Week</TabsTrigger>
          <TabsTrigger value="month">Current Month</TabsTrigger>
          <TabsTrigger value="overall">Overall</TabsTrigger>
        </TabsList>
        
        <TabsContent value="week" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Weekly Progress by Area</CardTitle>
              <p className="text-sm text-muted-foreground">
                Feb 19, 2024 - Feb 25, 2024
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {areas.map((area) => (
                <ProgressBar key={area.name} area={area} />
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Daily Check-In History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-primary/80 flex items-center justify-center text-xs text-white font-medium"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                7 day check-in streak! 🔥
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Monthly Progress by Area</CardTitle>
              <p className="text-sm text-muted-foreground">
                February 2024
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {areas.map((area) => (
                <ProgressBar key={area.name} area={{ ...area, percentage: Math.floor(area.percentage * 0.9) }} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overall" className="space-y-6 mt-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <p className="text-sm text-muted-foreground">
                Since Jan 22, 2021
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {areas.map((area) => (
                <ProgressBar key={area.name} area={area} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
