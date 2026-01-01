"use client";

import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async (onTranscript: (text: string) => void) => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop()); // Para o acesso ao microfone
        await transcribeAudio(audioBlob, onTranscript);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Gravação iniciada. Fale agora!");

    } catch (error) {
      console.error("Erro ao iniciar a gravação:", error);
      toast.error("Permissão para usar o microfone negada.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Gravação parada. A transcrever...");
    }
  };

  const transcribeAudio = async (audioBlob: Blob, onTranscript: (text: string) => void) => {
    setIsTranscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: audioBlob,
        headers: { 'Content-Type': 'audio/webm' },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.transcript) {
        onTranscript(data.transcript);
        toast.success("Transcrição concluída!");
      } else {
        toast.warning("Não foi possível detetar fala no áudio.");
      }

    } catch (err: any) {
      console.error("Erro na transcrição:", err);
      toast.error(`Falha na transcrição: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  return { isRecording, isTranscribing, startRecording, stopRecording };
};