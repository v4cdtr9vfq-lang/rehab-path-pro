import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw } from "lucide-react";

export default function Message() {
  const quotes = [
    {
      text: "It is always the simple that produces the marvelous.",
      author: "Amelia Barr"
    },
    {
      text: "Trust is built with consistency.",
      author: "Lincoln Chafee"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Daily Message</h1>
        <p className="text-muted-foreground text-lg">Inspiration and wisdom for your journey</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6 text-primary" />
            Today's Message
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {quotes.map((quote, i) => (
            <blockquote key={i} className="border-l-4 border-primary pl-6 py-2">
              <p className="text-xl italic text-foreground/90 mb-3">
                "{quote.text}"
              </p>
              <footer className="text-muted-foreground">
                — {quote.author}
              </footer>
            </blockquote>
          ))}
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-3">💡 Reflection Prompt</h3>
          <p className="text-foreground/80">
            How can you practice simplicity in your recovery today? What small, consistent action can you take 
            to build trust with yourself and others?
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Get Another Message
        </Button>
      </div>
    </div>
  );
}
