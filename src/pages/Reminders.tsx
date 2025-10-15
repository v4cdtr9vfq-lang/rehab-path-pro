import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus } from "lucide-react";

export default function Reminders() {
  const reminders = [
    { id: "1", title: "Morning meditation", time: "07:00 AM", enabled: true },
    { id: "2", title: "Daily check-in", time: "09:00 PM", enabled: true },
    { id: "3", title: "Evening gratitude", time: "08:30 PM", enabled: true },
    { id: "4", title: "Call sponsor", time: "12:00 PM", enabled: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Reminders</h1>
        <p className="text-muted-foreground text-lg">Stay on track with personalized notifications</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bell className="h-6 w-6 text-primary" />
            Stay Connected to Your Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Set up reminders to help maintain your daily practices, connect with your support network, 
            and stay focused on your recovery goals.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Your Reminders</h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Reminder
        </Button>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder) => (
          <Card key={reminder.id} className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{reminder.title}</h3>
                  <p className="text-sm text-muted-foreground">{reminder.time}</p>
                </div>
                <Switch checked={reminder.enabled} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
