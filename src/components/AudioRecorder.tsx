import { useState, useRef } from "react";
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
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // Get all available audio devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      console.log('Available audio devices:', audioInputs);
      
      if (audioInputs.length === 0) {
        throw new Error('No se encontró ningún micrófono');
      }

      // Request microphone with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          deviceId: audioInputs[0].deviceId // Use first available mic
        } 
      });

      // Log audio track info
      const audioTrack = stream.getAudioTracks()[0];
      console.log('Using audio device:', audioTrack.label);
      console.log('Audio track settings:', audioTrack.getSettings());
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      setRecordingDuration(0);

      // Update duration every 100ms
      durationIntervalRef.current = setInterval(() => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        console.log('Timer update - duration:', duration);
        setRecordingDuration(duration);
      }, 100);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        const duration = (Date.now() - startTimeRef.current) / 1000;
        console.log('Recording stopped. Duration:', duration, 'seconds');
        console.log('Total chunks:', chunksRef.current.length);
        
        if (duration < 1) {
          toast({
            title: "Grabación muy corta",
            description: "Por favor graba al menos 1 segundo de audio",
            variant: "destructive",
          });
          stream.getTracks().forEach(track => track.stop());
          setIsProcessing(false);
          return;
        }

        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Final audio blob size:', audioBlob.size, 'bytes');
        
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('Recording started! isRecording should now be true');
      console.log('Timer interval started, initial duration:', 0);
      
      toast({
        title: "Grabando",
        description: "Habla claramente hacia el micrófono...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
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
      console.log('Starting transcription...');
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        console.log('Base64 audio length:', base64Audio.length);
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) {
          console.error('Transcription error:', error);
          throw error;
        }

        console.log('Transcription response:', data);

        if (data?.text) {
          console.log('Transcribed text:', data.text);
          
          // Check if transcription looks valid (not just noise/silence)
          if (data.text.trim().length < 3) {
            toast({
              title: "No se detectó voz",
              description: "Por favor habla más claramente hacia el micrófono",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          onTranscriptionComplete(data.text);
          toast({
            title: "Transcripción completada",
            description: "Tu audio ha sido transcrito exitosamente",
          });
        }
        
        setIsProcessing(false);
      };

      reader.onerror = () => {
        console.error('Error reading audio file');
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

  console.log('AudioRecorder render - isRecording:', isRecording, 'duration:', recordingDuration);
  
  return (
    <div className="space-y-3">
      {/* Recording timer - large and visible */}
      {isRecording && (
        <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-4 text-center animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="text-2xl font-bold text-destructive">
              {recordingDuration.toFixed(1)}s
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            🎤 Grabando... Habla claramente hacia el micrófono
          </p>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center gap-2">
        {!isRecording && !isProcessing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startRecording}
            className="gap-2"
          >
            <Mic className="h-4 w-4" />
            Grabar Audio
          </Button>
        )}
        
        {isRecording && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Detener Grabación
          </Button>
        )}
        
        {isProcessing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribiendo...
          </Button>
        )}
      </div>
    </div>
  );
};
