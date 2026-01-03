import { useState, useRef, useCallback } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const [permissionPending, setPermissionPending] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      setPermissionPending(true);
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
        'audio/wav'
      ].find(type => MediaRecorder.isTypeSupported(type)) || '';

      console.log('Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('Data chunk received:', e.data.size);
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const type = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        console.log('Recording stopped. Total blob size:', blob.size, 'Type:', type);
        
        if (blob.size > 0) {
          setAudioBlob(blob);
        } else {
          toast({
            title: 'Erro na gravação',
            description: 'Não foi possível capturar o áudio (arquivo vazio). Tente novamente.',
            variant: 'destructive',
          });
        }
        
        chunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };

      // Request data every 1 second
      mediaRecorder.start(1000);
      console.log('MediaRecorder started');
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      
      // Check for permission error
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setPermissionDenied(true);
      }
      
      toast({
        title: 'Erro ao acessar microfone',
        description: 'Verifique as permissões do seu navegador. ' + (error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    } finally {
      setPermissionPending(false);
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const discardRecording = useCallback(() => {
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    chunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const uploadAudio = async (blob: Blob): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Use the blob's MIME type, or fallback to webm
      const mimeType = blob.type || 'audio/webm';
      // Extension based on mime type
      const ext = mimeType.split('/')[1]?.split(';')[0] || 'webm';
      
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      
      console.log('Uploading audio...', { fileName, mimeType, size: blob.size });

      const { data, error } = await supabase.storage
        .from('audio-notes')
        .upload(fileName, blob, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('audio-notes')
        .getPublicUrl(fileName);

      console.log('Audio uploaded successfully:', publicData.publicUrl);
      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: 'Erro ao salvar áudio',
        description: 'Não foi possível fazer upload da gravação. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    isRecording,
    recordingTime,
    audioBlob,
    permissionPending,
    permissionDenied,
    startRecording,
    stopRecording,
    discardRecording,
    uploadAudio
  };
}
