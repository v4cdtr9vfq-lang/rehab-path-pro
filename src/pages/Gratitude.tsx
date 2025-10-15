import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Sparkles } from "lucide-react";
import { useState } from "react";

interface GratitudeEntry {
  id: string;
  date: Date;
  items: string[];
}

export default function Gratitude() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([
    {
      id: "1",
      date: new Date(),
      items: [
        "My supportive family",
        "Another day of sobriety",
        "A beautiful morning walk"
      ]
    }
  ]);

  const [newItem, setNewItem] = useState("");

  const addGratitudeItem = () => {
    if (newItem.trim()) {
      const today = entries.find(e => 
        e.date.toDateString() === new Date().toDateString()
      );
      
      if (today) {
        setEntries(entries.map(e => 
          e.id === today.id 
            ? { ...e, items: [...e.items, newItem] }
            : e
        ));
      }
      setNewItem("");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Gratitude List</h1>
        <p className="text-muted-foreground text-lg">Cultivate gratitude and recognize life's blessings</p>
      </div>

      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-accent" />
            Why Gratitude Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Practicing gratitude shifts your focus from what's missing to what's present. 
            Regular gratitude practice has been shown to improve mental health, strengthen relationships, 
            and support long-term recovery.
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Gratitude
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder="What are you grateful for today?"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="min-h-[100px] text-base"
            />
            <Button onClick={addGratitudeItem} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add to Today's List
            </Button>
          </div>

          {entries[0]?.items.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-foreground">Today I'm grateful for:</h3>
              <ul className="space-y-2">
                {entries[0].items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="p-4 rounded-lg bg-card/50 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {entry.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <ul className="space-y-2">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-foreground/80">
                    <span className="text-accent">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
