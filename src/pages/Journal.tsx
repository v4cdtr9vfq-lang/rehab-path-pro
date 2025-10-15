import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Search } from "lucide-react";
import { useState } from "react";

interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  tags: string[];
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "1",
      date: new Date(),
      title: "Reflection on today's meeting",
      content: "Today's meeting really resonated with me. The speaker talked about acceptance and how fighting reality only causes more pain...",
      tags: ["meeting", "acceptance"]
    }
  ]);

  const [showNewEntry, setShowNewEntry] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Journal</h1>
        <p className="text-muted-foreground text-lg">Capture your thoughts, feelings, and reflections</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your journal..."
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setShowNewEntry(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {showNewEntry && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>New Journal Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Entry title..." />
            <Textarea
              placeholder="Write your thoughts..."
              className="min-h-[200px]"
            />
            <Input placeholder="Tags (comma separated)" />
            <div className="flex gap-2">
              <Button className="flex-1">Save Entry</Button>
              <Button variant="outline" onClick={() => setShowNewEntry(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Recent Entries</h2>
        {entries.map((entry) => (
          <Card key={entry.id} className="border-primary/20 hover:shadow-medium transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{entry.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {entry.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 mb-4">{entry.content}</p>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
