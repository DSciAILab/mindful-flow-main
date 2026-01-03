import { useCallback, useRef, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Sound options with embedded Web Audio synthesis
export interface SoundOption {
  id: string;
  name: string;
  type: 'focus_end' | 'break_end' | 'tick';
  description: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'ding', name: 'Ding', type: 'focus_end', description: 'Som de sino suave' },
  { id: 'chime', name: 'Chime', type: 'focus_end', description: 'Carrilhão relaxante' },
  { id: 'bell', name: 'Bell', type: 'focus_end', description: 'Sino de meditação' },
  { id: 'gong', name: 'Gong', type: 'focus_end', description: 'Gongo profundo' },
  { id: 'birds', name: 'Pássaros', type: 'focus_end', description: 'Canto de pássaros' },
  { id: 'none', name: 'Sem som', type: 'focus_end', description: 'Silencioso' },
];

export interface TimerSoundSettings {
  focusEndSound: string;
  breakEndSound: string;
  volume: number;
  enabled: boolean;
}

const DEFAULT_SETTINGS: TimerSoundSettings = {
  focusEndSound: 'chime',
  breakEndSound: 'ding',
  volume: 0.7,
  enabled: true,
};

// Web Audio API sound synthesis
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    console.warn('Web Audio API not supported');
    return null;
  }
}

function playDing(audioContext: AudioContext, volume: number) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.8);
}

function playChime(audioContext: AudioContext, volume: number) {
  const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.type = 'sine';
    
    const startTime = audioContext.currentTime + (index * 0.15);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1.2);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 1.2);
  });
}

function playBell(audioContext: AudioContext, volume: number) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 2);
  
  // Add harmonic
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  osc2.connect(gain2);
  gain2.connect(audioContext.destination);
  osc2.frequency.setValueAtTime(880, audioContext.currentTime);
  osc2.type = 'sine';
  gain2.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
  osc2.start(audioContext.currentTime);
  osc2.stop(audioContext.currentTime + 1.5);
}

function playGong(audioContext: AudioContext, volume: number) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(110, audioContext.currentTime); // A2 - deep
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 3);
  
  // Overtones
  [220, 330, 440].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume * (0.3 - i * 0.08), audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (2.5 - i * 0.3));
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + (2.5 - i * 0.3));
  });
}

function playBirds(audioContext: AudioContext, volume: number) {
  // Chirp sounds
  for (let i = 0; i < 3; i++) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const startTime = audioContext.currentTime + (i * 0.3);
    const baseFreq = 2000 + Math.random() * 1000;
    
    oscillator.frequency.setValueAtTime(baseFreq, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, startTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, startTime + 0.15);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  }
}

export function useTimerSounds() {
  const [settings, setSettings] = useState<TimerSoundSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { user } = useAuth();

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('mf_profiles')
          .select('timer_sound_settings')
          .eq('id', user.id)
          .single();

        if (!error && data?.timer_sound_settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.timer_sound_settings });
        }
      } catch (err) {
        console.error('Error loading timer sound settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Save settings to database
  const saveSettings = useCallback(async (newSettings: Partial<TimerSoundSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (!user) return;

    try {
      await supabase
        .from('mf_profiles')
        .update({ timer_sound_settings: updated })
        .eq('id', user.id);
    } catch (err) {
      console.error('Error saving timer sound settings:', err);
    }
  }, [user, settings]);

  // Play a sound
  const playSound = useCallback((soundId: string) => {
    if (!settings.enabled || soundId === 'none') return;

    // Initialize audio context on first use (needs user interaction)
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const volume = settings.volume;

    switch (soundId) {
      case 'ding':
        playDing(ctx, volume);
        break;
      case 'chime':
        playChime(ctx, volume);
        break;
      case 'bell':
        playBell(ctx, volume);
        break;
      case 'gong':
        playGong(ctx, volume);
        break;
      case 'birds':
        playBirds(ctx, volume);
        break;
    }
  }, [settings.enabled, settings.volume]);

  // Play focus end sound
  const playFocusEndSound = useCallback(() => {
    playSound(settings.focusEndSound);
  }, [playSound, settings.focusEndSound]);

  // Play break end sound
  const playBreakEndSound = useCallback(() => {
    playSound(settings.breakEndSound);
  }, [playSound, settings.breakEndSound]);

  // Preview a sound
  const previewSound = useCallback((soundId: string) => {
    playSound(soundId);
  }, [playSound]);

  return {
    settings,
    loading,
    saveSettings,
    playSound,
    playFocusEndSound,
    playBreakEndSound,
    previewSound,
    soundOptions: SOUND_OPTIONS,
  };
}
