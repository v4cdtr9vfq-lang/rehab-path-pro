import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground text-lg">Customize your RehabApp experience</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Recovery Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="start-date">Abstinence Start Date</Label>
            <Input id="start-date" type="date" defaultValue="2021-01-22" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Check-In Reminder</Label>
              <p className="text-sm text-muted-foreground">Get notified to complete your daily check-in</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Goal Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive reminders for upcoming goals</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>App Lock</Label>
              <p className="text-sm text-muted-foreground">Require PIN or biometric to open app</p>
            </div>
            <Switch />
          </div>

          <Button variant="outline" className="w-full">
            Export My Data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <Button variant="link" className="p-0 h-auto">
            Privacy Policy
          </Button>
          <Button variant="link" className="p-0 h-auto">
            Terms of Service
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
