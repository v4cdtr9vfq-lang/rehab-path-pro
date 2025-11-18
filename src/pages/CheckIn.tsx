import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Question {
  id: number;
  key: string;
  type: "yesno" | "text" | "scale";
}

interface UserAddiction {
  id: string;
  name: string;
  isOriginal: boolean;
}

const getQuestions = (t: any): Question[] => [
  { id: 1, key: "question1", type: "yesno" },
  { id: 2, key: "question2", type: "yesno" },
  { id: 3, key: "question3", type: "text" },
  { id: 4, key: "question4", type: "yesno" },
  { id: 5, key: "question5", type: "yesno" },
  { id: 6, key: "question6", type: "yesno" },
  { id: 7, key: "question7", type: "yesno" },
  { id: 8, key: "question8", type: "yesno" },
  { id: 9, key: "question9", type: "yesno" },
  { id: 10, key: "question10", type: "yesno" },
  { id: 11, key: "question11", type: "scale" },
  { id: 12, key: "question12", type: "scale" },
  { id: 13, key: "question13", type: "scale" },
  { id: 14, key: "question14", type: "scale" },
];

export default function CheckIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'es' ? es : enUS;
  const questions = getQuestions(t);
  const { currentStep, updateStep } = useGuidedOnboarding();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [triggerDescription, setTriggerDescription] = useState("");
  const [resentmentDescription, setResentmentDescription] = useState("");
  const [valuesDescription, setValuesDescription] = useState("");
  const [limitingDescription, setLimitingDescription] = useState("");
  const [negativeThoughtsDescription, setNegativeThoughtsDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userValues, setUserValues] = useState<string[]>([]);
  const [showRelapseDialog, setShowRelapseDialog] = useState(false);
  const [relapseConfirmed, setRelapseConfirmed] = useState(false);
  const [userAddictions, setUserAddictions] = useState<UserAddiction[]>([]);
  const [selectedRelapseAddiction, setSelectedRelapseAddiction] = useState<string>("");

  useEffect(() => {
    const loadExistingCheckIn = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .maybeSingle();

      if (checkIn?.answers) {
        setAnswers(checkIn.answers as Record<number, string>);
        // Load trigger description if exists
        if ((checkIn.answers as any).trigger_description) {
          setTriggerDescription((checkIn.answers as any).trigger_description);
        }
        // Load resentment description if exists
        if ((checkIn.answers as any).resentment_description) {
          setResentmentDescription((checkIn.answers as any).resentment_description);
        }
        // Load values description if exists
        if ((checkIn.answers as any).values_description) {
          setValuesDescription((checkIn.answers as any).values_description);
        }
        // Load limiting description if exists
        if ((checkIn.answers as any).limiting_description) {
          setLimitingDescription((checkIn.answers as any).limiting_description);
        }
        // Load negative thoughts description if exists
        if ((checkIn.answers as any).negative_thoughts_description) {
          setNegativeThoughtsDescription((checkIn.answers as any).negative_thoughts_description);
        }
      }

      // Load user values
      const { data: values } = await supabase
        .from('values')
        .select('name')
        .eq('user_id', user.id);

      if (values) {
        setUserValues(values.map(v => v.name));
      }

      // Load user addictions
      const { data: profile } = await supabase
        .from('profiles')
        .select('rehabilitation_type')
        .eq('user_id', user.id)
        .single();

      const { data: addictions } = await supabase
        .from('addictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      const allAddictions: UserAddiction[] = [];
      
      // Add original addiction from profile
      if (profile?.rehabilitation_type) {
        allAddictions.push({
          id: 'original',
          name: profile.rehabilitation_type,
          isOriginal: true
        });
      }

      // Add additional addictions
      if (addictions) {
        addictions.forEach(addiction => {
          allAddictions.push({
            id: addiction.id,
            name: addiction.addiction_type,
            isOriginal: false
          });
        });
      }

      setUserAddictions(allAddictions);
      
      console.log('Adicciones cargadas:', allAddictions);
      
      // Pre-select first addiction if available
      if (allAddictions.length > 0) {
        setSelectedRelapseAddiction(allAddictions[0].id);
      }
    };

    loadExistingCheckIn();
  }, []);

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Show relapse dialog if question 1 is answered "no"
    if (questionId === 1 && answer === "no") {
      setShowRelapseDialog(true);
      setRelapseConfirmed(false);
    }
  };

  const handleConfirmRelapse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!selectedRelapseAddiction) {
        toast({
          title: t('common.error'),
          description: t('checkIn.selectAddictionError'),
          variant: "destructive",
        });
        return;
      }

      // Reset the selected addiction's counter
      if (selectedRelapseAddiction === 'original') {
        // Reset original addiction in profiles
        const { error } = await supabase
          .from('profiles')
          .update({
            abstinence_start_date: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Reset additional addiction's start date
        const { error } = await supabase
          .from('addictions')
          .update({
            start_date: new Date().toISOString()
          })
          .eq('id', selectedRelapseAddiction)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      setRelapseConfirmed(true);
      
      toast({
        title: t('checkIn.counterReset'),
        description: t('checkIn.counterResetDescription'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('checkIn.couldNotResetCounter'),
        variant: "destructive",
      });
    }
  };

  const handleRelapseInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Create journal entry
      const { error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_date: today,
          title: t('checkIn.relapseInventoryTitle'),
          content: "",
          tags: [t('checkIn.tagRelapse'), t('checkIn.tagInventory')]
        });

      if (journalError) throw journalError;

      setShowRelapseDialog(false);
      setRelapseConfirmed(false);
      navigate('/journal');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('checkIn.couldNotCreateInventory'),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t('common.error'),
          description: t('checkIn.loginRequiredError'),
          variant: "destructive",
        });
        return;
      }

      // Save check-in with trigger, values, and limiting descriptions
      // Use default text for question 3 if empty
      const finalAnswers = { ...answers };
      if (!finalAnswers[3] || finalAnswers[3].trim() === "") {
        finalAnswers[3] = t('checkIn.defaultPlaceholder');
      }
      
      const answersWithDescriptions = {
        ...finalAnswers,
        trigger_description: triggerDescription,
        resentment_description: resentmentDescription,
        values_description: valuesDescription,
        limiting_description: limitingDescription,
        negative_thoughts_description: negativeThoughtsDescription
      };

      const { error: checkInError } = await supabase
        .from('check_ins')
        .upsert({
          user_id: user.id,
          check_in_date: new Date().toISOString().split('T')[0],
          answers: answersWithDescriptions,
        }, {
          onConflict: 'user_id,check_in_date'
        });

      if (checkInError) throw checkInError;

      const today = new Date().toISOString().split('T')[0];
      
      // Create comprehensive check-in journal entry
      const journalTitle = formatDate(new Date(), i18n.language);
      
      // Build journal content with all text answers in a single line
      let journalParts = [];
      
      // Question 2 - trigger description
      if (answers[2] === "yes" && triggerDescription.trim()) {
        journalParts.push(`${t('checkIn.journalTrigger')}: ${triggerDescription.trim()}`);
      }
      
      // Question 4 - resentment description
      if (answers[4] === "yes" && resentmentDescription.trim()) {
        journalParts.push(`${t('checkIn.journalResentment')}: ${resentmentDescription.trim()}`);
      }
      
      // Question 7 - values description
      if (answers[7] === "no" && valuesDescription.trim()) {
        journalParts.push(`${t('checkIn.journalValues')}: ${valuesDescription.trim()}`);
      }
      
      // Question 8 - limiting description
      if (answers[8] === "yes" && limitingDescription.trim()) {
        journalParts.push(`${t('checkIn.journalLimiting')}: ${limitingDescription.trim()}`);
      }
      
      // Question 9 - negative thoughts description
      if (answers[9] === "yes" && negativeThoughtsDescription.trim()) {
        journalParts.push(`${t('checkIn.journalNegativeThoughts')}: ${negativeThoughtsDescription.trim()}`);
      }
      
      // Join all parts with " - "
      let journalContent = journalParts.join(" - ");
      
      // Build tags array
      const journalTags = ["check-in", t('checkIn.tagObservations')];
      if (answers[2] === "yes" && triggerDescription.trim()) {
        journalTags.push(t('checkIn.tagSituations'));
      }
      if (answers[4] === "yes" && resentmentDescription.trim()) {
        journalTags.push(t('checkIn.tagResentments'));
      }
      if (answers[8] === "yes" && limitingDescription.trim()) {
        journalTags.push(t('checkIn.tagLimitations'));
      }
      
      // Create or update the check-in journal entry
      if (journalContent.trim()) {
        const checkInTitle = `Check-in ${journalTitle}`;
        const { data: existingEntry } = await supabase
          .from('journal_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .eq('title', checkInTitle)
          .maybeSingle();

        if (existingEntry) {
          // Update existing entry
          const { error: journalError } = await supabase
            .from('journal_entries')
            .update({
              content: journalContent.trim(),
              tags: journalTags
            })
            .eq('id', existingEntry.id);

          if (journalError) {
            console.error("Error updating journal entry:", journalError);
          }
        } else {
          // Insert new entry
          const { error: journalError } = await supabase
            .from('journal_entries')
            .insert({
              user_id: user.id,
              entry_date: today,
              title: checkInTitle,
              content: journalContent.trim(),
              tags: journalTags
            });

          if (journalError) {
            console.error("Error inserting journal entry:", journalError);
          }
        }
      }

      toast({
        title: t('checkIn.checkInSaved'),
        description: t('checkIn.checkInSavedSuccess'),
      });

      // Update guided onboarding step if in the flow
      if (currentStep === 'check_in') {
        await updateStep('daily_inventory');
      }

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('checkIn.couldNotSaveCheckIn'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-[35px] animate-in fade-in duration-500">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="md:hidden">{t('checkIn.checkIn')}</span>
            <span className="hidden md:inline">{t('checkIn.title')}</span>
            <span className="text-xl">👀</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date(), i18n.language)}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-base font-medium text-foreground pl-4">
                {question.id}. {t(`checkIn.${question.key}`)}
              </Label>
              
              {question.type === "yesno" ? (
                <>
                  <div className="flex gap-3">
                    <Button
                      variant={answers[question.id] === "yes" ? "default" : "outline"}
                      className={`flex-1 ${answers[question.id] === "yes" && [1, 5, 7, 10].includes(question.id) ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                      onClick={() => handleAnswer(question.id, "yes")}
                    >
                      {t('checkIn.yes')}
                    </Button>
                    <Button
                      variant={answers[question.id] === "no" ? "default" : "outline"}
                      className={`flex-1 ${
                        answers[question.id] === "no" && question.id === 1 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : answers[question.id] === "no" && [2, 4, 6, 8, 9].includes(question.id) 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : ""
                      }`}
                      onClick={() => handleAnswer(question.id, "no")}
                    >
                      {t('checkIn.no')}
                    </Button>
                  </div>
                  
                  {/* Show trigger description field if question 2 answered "yes" */}
                  {question.id === 2 && answers[2] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="trigger-description" className="text-sm font-medium text-foreground pl-4">
                        {t('checkIn.triggerLabel')}
                      </Label>
                      <Textarea
                        id="trigger-description"
                        placeholder={t('checkIn.triggerPlaceholder')}
                        value={triggerDescription}
                        onChange={(e) => setTriggerDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('checkIn.triggerHelp')}
                      </p>
                    </div>
                  )}

                  {/* Show resentment description field if question 4 answered "yes" */}
                  {question.id === 4 && answers[4] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="resentment-description" className="text-sm font-medium text-foreground pl-4">
                        {t('checkIn.resentmentLabel')}
                      </Label>
                      <Textarea
                        id="resentment-description"
                        placeholder={t('checkIn.resentmentPlaceholder')}
                        value={resentmentDescription}
                        onChange={(e) => setResentmentDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('checkIn.resentmentHelp')}
                      </p>
                    </div>
                  )}

                  {/* Show values description field if question 7 answered "no" */}
                  {question.id === 7 && answers[7] === "no" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="values-description" className="text-sm font-medium text-foreground pl-4">
                        {t('checkIn.valuesLabel')}
                      </Label>
                      <Textarea
                        id="values-description"
                        placeholder={t('checkIn.valuesPlaceholder')}
                        value={valuesDescription}
                        onChange={(e) => setValuesDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('checkIn.valuesHelp')}
                      </p>
                      {userValues.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {userValues.map((value, index) => (
                            <span key={index} className="text-sm text-red-500 font-medium">
                              {value}{index < userValues.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show limiting description field if question 8 answered "yes" */}
                  {question.id === 8 && answers[8] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="limiting-description" className="text-sm font-medium text-foreground pl-4">
                        {t('checkIn.limitingLabel')}
                      </Label>
                      <Textarea
                        id="limiting-description"
                        placeholder={t('checkIn.limitingPlaceholder')}
                        value={limitingDescription}
                        onChange={(e) => setLimitingDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}

                  {/* Show negative thoughts description field if question 9 answered "yes" */}
                  {question.id === 9 && answers[9] === "yes" && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="negative-thoughts-description" className="text-sm font-medium text-foreground pl-4">
                        {t('checkIn.negativeThoughtsLabel')}
                      </Label>
                      <Textarea
                        id="negative-thoughts-description"
                        placeholder={t('checkIn.negativeThoughtsPlaceholder')}
                        value={negativeThoughtsDescription}
                        onChange={(e) => setNegativeThoughtsDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                </>
              ) : question.type === "scale" ? (
                <div className="flex gap-2 justify-start">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Button
                      key={num}
                      variant={answers[question.id] === String(num) ? "default" : "outline"}
                      className={`w-12 h-12 p-0 !rounded-full font-semibold text-base shadow-md transition-all ${
                        answers[question.id] === String(num)
                          ? num <= 4
                            ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-orange-600/50 scale-110"
                            : num <= 6
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 shadow-yellow-600/50 scale-110"
                            : "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-green-600/50 scale-110"
                          : "hover:scale-105 hover:shadow-lg"
                      }`}
                      onClick={() => handleAnswer(question.id, String(num))}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              ) : (
                <Input
                  placeholder={question.id === 3 ? t('checkIn.defaultPlaceholder') : t('checkIn.writePlaceholder')}
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="text-sm lg:text-base"
                />
              )}
            </div>
          ))}

          <Button 
            className="w-full gap-2 text-lg py-6 mt-8 hover:bg-green-600"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('checkIn.submitting') : t('checkIn.submit')}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-6">
          <p className="text-center text-foreground/80">
            {t('checkIn.helpText')}
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showRelapseDialog} onOpenChange={(open) => {
        setShowRelapseDialog(open);
        if (!open) {
          setRelapseConfirmed(false);
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-left">{t('checkIn.relapseTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {t('checkIn.relapseDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {userAddictions.length > 1 ? (
              <div className="space-y-2">
                <Label className="text-left">{t('checkIn.relapseAddictionLabel')}</Label>
                <Select
                  value={selectedRelapseAddiction}
                  onValueChange={setSelectedRelapseAddiction}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('checkIn.relapseAddictionPlaceholder')} />
                  </SelectTrigger>
                   <SelectContent className="bg-background">
                    {userAddictions.map((addiction, index) => (
                      <SelectItem key={addiction.id} value={addiction.id}>
                        {index + 1}. {t(`addictions.${addiction.name}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground text-left">{t('checkIn.totalAddictions')} {userAddictions.length}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-left">{t('checkIn.totalAddictions')} {userAddictions.length}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full -mt-[20px]">
            <Button onClick={handleRelapseInventory} className="bg-secondary w-full justify-start">
              {t('checkIn.inventory')}
            </Button>
            {!relapseConfirmed && (
              <Button onClick={handleConfirmRelapse} className="bg-primary w-full justify-start">
                {t('checkIn.confirm')}
              </Button>
            )}
            <Button onClick={() => {
              setShowRelapseDialog(false);
              setRelapseConfirmed(false);
            }} variant="outline" className="w-full justify-start">
              {t('checkIn.close')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
