import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";

export default function Values() {
  const [values, setValues] = useState([
    { id: "1", name: "Self-care", selected: true },
    { id: "2", name: "Gratitude", selected: false },
    { id: "3", name: "Humour", selected: false },
    { id: "4", name: "Respect", selected: true },
    { id: "5", name: "Health", selected: false },
    { id: "6", name: "Considerate", selected: false },
    { id: "7", name: "Engagement", selected: false },
  ]);

  const toggleValue = (id: string) => {
    setValues(prev =>
      prev.map(v => v.id === id ? { ...v, selected: !v.selected } : v)
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">My Values</h1>
        <p className="text-muted-foreground text-lg">Define and live by your core values every day</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-accent" />
            What Matters Most
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Your values are the principles that guide your recovery journey. Select the values you want to focus on today, 
            and we'll remind you to honor them throughout the day.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-foreground">Your Values</h2>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Value
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-4">
            {values.map((value) => (
              <div
                key={value.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  value.selected
                    ? "bg-primary/10 border-2 border-primary/30"
                    : "bg-card/50 border-2 border-transparent hover:border-primary/10"
                }`}
              >
                <Checkbox
                  checked={value.selected}
                  onCheckedChange={() => toggleValue(value.id)}
                  className="h-5 w-5"
                />
                <span className="text-lg text-foreground flex-1">{value.name}</span>
                {value.selected && (
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                    Active Today
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">💡 Daily Values Reminder</h3>
            <p className="text-foreground/80 text-sm">
              You've selected <span className="font-bold text-accent">{values.filter(v => v.selected).length} values</span> for today. 
              We'll check in with you during your daily check-in to see if you've honored these values.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
