import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  console.log('🔴 AudioRecorder RENDER - isRecording:', isRecording, 'seconds:', seconds, 'isProcessing:', isProcessing);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setSeconds(prev => prev + 0.1);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSeconds(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      console.log('🎙️ START RECORDING CLICKED!');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Detect supported MIME type (Safari/iOS doesn't support webm)
      let mimeType = 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else {
        // Let the browser use its default format
        mimeType = '';
      }

      console.log('Using MIME type:', mimeType || 'browser default');

      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing...');
        setIsProcessing(true);
        
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: actualMimeType });
        await transcribeAudio(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      console.log('📝 About to set isRecording to TRUE');
      setIsRecording(true);
      console.log('✅ isRecording has been set to TRUE');
      
      toast({
        title: t('journal.recording'),
        description: t('journal.speakNow'),
      });
    } catch (error: any) {
      console.error('Error starting recording:', error);
      
      let errorMessage = t('journal.microphoneError');
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        errorMessage = t('journal.microphonePermissionDenied');
      } else if (error.name === 'NotFoundError') {
        errorMessage = t('journal.microphoneNotFound');
      } else if (error.name === 'NotReadableError') {
        errorMessage = t('journal.microphoneInUse');
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text && data.text.trim().length > 3) {
          onTranscriptionComplete(data.text);
          toast({
            title: t('journal.transcriptionComplete'),
            description: t('journal.audioTranscribed'),
          });
        } else {
          toast({
            title: t('journal.noVoiceDetected'),
            description: t('journal.speakClearly'),
            variant: "destructive",
          });
        }
        
        setIsProcessing(false);
      };

      reader.onerror = () => {
        toast({
          title: t('common.error'),
          description: t('journal.errorReadingAudio'),
          variant: "destructive",
        });
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: t('common.error'),
        description: t('journal.errorTranscribing'),
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {isRecording && (
        <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="w-4 h-4 bg-destructive rounded-full animate-pulse" />
            <span className="text-4xl font-bold text-destructive tabular-nums">
              {seconds.toFixed(1)}s
            </span>
          </div>
          <p className="text-base text-foreground mt-3 font-medium">
            {t('journal.recordingSpeakClearly')}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isRecording && !isProcessing && (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={startRecording}
            className="gap-2"
          >
            <Mic className="h-5 w-5" />
            {t('journal.recordAudio')}
          </Button>
        )}
        
        {isRecording && (
          <Button
            type="button"
            variant="destructive"
            size="default"
            onClick={stopRecording}
            className="gap-2"
          >
            <Square className="h-5 w-5" />
            {t('journal.stopRecording')}
          </Button>
        )}
        
        {isProcessing && (
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled
            className="gap-2"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('journal.transcribing')}
          </Button>
        )}
      </div>
    </div>
  );
};