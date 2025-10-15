import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Anchor, Phone, AlertCircle, HeartPulse } from "lucide-react";

export default function Tools() {
  const tools = [
    {
      icon: Wind,
      title: "Breathing Exercise",
      description: "Calm your mind with guided breathing techniques",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: Anchor,
      title: "Grounding Exercise",
      description: "Connect with the present moment using the 5-4-3-2-1 technique",
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      icon: Phone,
      title: "Emergency Contacts",
      description: "Quick access to your support network",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: AlertCircle,
      title: "Crisis Plan",
      description: "Your personalized plan for difficult moments",
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      icon: HeartPulse,
      title: "Self-Care Menu",
      description: "Quick activities to support your wellbeing",
      color: "text-accent",
      bgColor: "bg-accent/10"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Tools</h1>
        <p className="text-muted-foreground text-lg">Resources to support you in challenging moments</p>
      </div>

      <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">In Crisis?</h3>
              <p className="text-sm text-foreground/80 mb-4">
                If you're in immediate danger or experiencing a crisis, please reach out for help immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="destructive" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Crisis Hotline
                </Button>
                <Button variant="outline">
                  Contact My Sponsor
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <Card
              key={index}
              className="border-primary/20 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${tool.bgColor}`}>
                    <Icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">{tool.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            My Support Network
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Sponsor - John", phone: "(555) 123-4567" },
            { name: "Recovery Friend - Sarah", phone: "(555) 987-6543" },
            { name: "Therapist - Dr. Smith", phone: "(555) 456-7890" }
          ].map((contact, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
              <span className="font-medium text-foreground">{contact.name}</span>
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="h-4 w-4" />
                Call
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2">
            <Phone className="h-4 w-4" />
            Add Contact
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
