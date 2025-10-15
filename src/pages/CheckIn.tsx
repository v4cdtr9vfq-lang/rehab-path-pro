import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Calendar } from "lucide-react";
import { useState } from "react";

interface Question {
  id: number;
  text: string;
  type: "yesno" | "text";
}

const questions: Question[] = [
  { id: 1, text: "Was I abstinent today?", type: "yesno" },
  { id: 2, text: "Did I encounter a situation that was triggering for me?", type: "yesno" },
  { id: 3, text: "What is the one best word to describe how I felt today?", type: "text" },
  { id: 4, text: "Was I resentful today?", type: "yesno" },
  { id: 5, text: "Was I honest with my feelings today?", type: "yesno" },
  { id: 6, text: "Did I isolate today?", type: "yesno" },
  { id: 7, text: "Did I adhere to my daily values?", type: "yesno" },
];

export default function CheckIn() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feelingWords, setFeelingWords] = useState(["Comfortable", "Confident"]);

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    console.log("Submitted answers:", answers);
    // Here you would save to database
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Daily Check-In</h1>
        <p className="text-muted-foreground text-lg">Reflect on your day and track your progress</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Daily Check-In Summary
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-base font-medium text-foreground">
                {question.id}. {question.text}
              </Label>
              
              {question.type === "yesno" ? (
                <div className="flex gap-3">
                  <Button
                    variant={answers[question.id] === "yes" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleAnswer(question.id, "yes")}
                  >
                    YES
                  </Button>
                  <Button
                    variant={answers[question.id] === "no" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleAnswer(question.id, "no")}
                  >
                    NO
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Type a word..."
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    className="text-base"
                  />
                  <div className="flex flex-wrap gap-2">
                    {feelingWords.map((word, i) => (
                      <Button
                        key={i}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAnswer(question.id, word)}
                      >
                        {word}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button 
            className="w-full gap-2 text-lg py-6 mt-8"
            size="lg"
            onClick={handleSubmit}
          >
            Submit
            <ArrowRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-6">
          <p className="text-center text-foreground/80">
            Daily check-ins help you stay aware of your emotional state and identify patterns in your recovery journey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
