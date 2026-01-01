"use client";

import { useCallback } from 'react';

export const useSound = () => {
  const playSound = useCallback((type: 'pomodoro' | 'break') => {
    // Garante que o código só rode no navegador
    if (typeof window === 'undefined') return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    // Previne que o som seja bloqueado por políticas de autoplay do navegador
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01); // Volume mais baixo

    if (type === 'pomodoro') {
      // Um som de dois tons para o fim do pomodoro
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.15); // C6
    } else {
      // Um tom único e mais baixo para o fim da pausa
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
    }

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  return { playSound };
};