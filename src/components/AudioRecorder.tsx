import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
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

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
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
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        await transcribeAudio(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      console.log('📝 About to set isRecording to TRUE');
      setIsRecording(true);
      console.log('✅ isRecording has been set to TRUE');
      
      toast({
        title: "Grabando",
        description: "Habla claramente hacia el micrófono...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Verifica los permisos.",
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
            title: "Transcripción completada",
            description: "Tu audio ha sido transcrito exitosamente",
          });
        } else {
          toast({
            title: "No se detectó voz",
            description: "Por favor habla más claramente hacia el micrófono",
            variant: "destructive",
          });
        }
        
        setIsProcessing(false);
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "No se pudo leer el archivo de audio",
          variant: "destructive",
        });
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Error",
        description: "No se pudo transcribir el audio",
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
            Grabando... Habla claramente
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
            Grabar Audio
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
            Detener Grabación
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
            Transcribiendo...
          </Button>
        )}
      </div>
    </div>
  );
};