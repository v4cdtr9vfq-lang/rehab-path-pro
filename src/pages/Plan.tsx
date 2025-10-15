import { AbstinenceCounter } from "@/components/AbstinenceCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  remaining: number;
}

export default function Plan() {
  const startDate = new Date("2021-01-22");
  
  const [sections, setSections] = useState({
    today: { open: true, goals: [] },
    week: { open: false, goals: [] },
    month: { open: false, goals: [] },
    onetime: { open: false, goals: [] }
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], open: !prev[section].open }
    }));
  };

  const toggleGoal = (sectionKey: keyof typeof sections, goalId: string) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        goals: prev[sectionKey].goals.map(goal =>
          goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
        )
      }
    }));
  };

  const SectionHeader = ({ title, sectionKey }: { title: string; sectionKey: keyof typeof sections }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full text-left"
    >
      <div className="flex items-center gap-2">
        <span className="text-primary">✓</span>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      </div>
      {sections[sectionKey].open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </button>
  );

  const GoalItem = ({ goal, sectionKey }: { goal: Goal; sectionKey: keyof typeof sections }) => (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 hover:bg-card transition-colors">
      <Checkbox
        checked={goal.completed}
        onCheckedChange={() => toggleGoal(sectionKey, goal.id)}
        className="mt-1"
      />
      <div className="flex-1">
        <p className={`text-foreground ${goal.completed ? "line-through opacity-60" : ""}`}>
          {goal.text}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {goal.remaining} remaining {sectionKey === "today" ? "today" : sectionKey === "week" ? "this week" : sectionKey === "month" ? "this month" : ""}
        </p>
      </div>
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary/30 text-primary font-medium">
        {goal.remaining}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight mb-3">My Plan</h1>
        <p className="text-muted-foreground text-lg">Track your recovery goals and progress</p>
      </div>

      <AbstinenceCounter startDate={startDate} />

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Goals</h2>
        <Button variant="accent" className="gap-2">
          <Plus className="h-5 w-5" />
          Add Goal
        </Button>
      </div>

      <div className="space-y-4">
        {/* Today */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="Today" sectionKey="today" />
          </CardHeader>
          {sections.today.open && (
            <CardContent className="space-y-3">
              {sections.today.goals.map(goal => (
                <GoalItem key={goal.id} goal={goal} sectionKey="today" />
              ))}
            </CardContent>
          )}
        </Card>

        {/* This Week */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="This Week (M-S)" sectionKey="week" />
          </CardHeader>
          {sections.week.open && (
            <CardContent className="space-y-3">
              {sections.week.goals.map(goal => (
                <GoalItem key={goal.id} goal={goal} sectionKey="week" />
              ))}
            </CardContent>
          )}
        </Card>

        {/* This Month */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="This Month" sectionKey="month" />
          </CardHeader>
          {sections.month.open && (
            <CardContent className="space-y-3">
              {sections.month.goals.map(goal => (
                <GoalItem key={goal.id} goal={goal} sectionKey="month" />
              ))}
            </CardContent>
          )}
        </Card>

        {/* One-Time Goals */}
        <Card className="border-border/50 bg-card/50 backdrop-blur rounded-3xl shadow-lg">
          <CardHeader>
            <SectionHeader title="One-Time Goals" sectionKey="onetime" />
          </CardHeader>
          {sections.onetime.open && (
            <CardContent className="space-y-3">
              {sections.onetime.goals.map(goal => (
                <GoalItem key={goal.id} goal={goal} sectionKey="onetime" />
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
