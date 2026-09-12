/**
 * Quiz Sound Effects Hook
 * Uses Web Audio API for lightweight, instant sound effects
 */

import { useCallback, useRef } from 'react';

interface SoundOptions {
  frequency?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
}

export const useQuizSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((options: SoundOptions = {}) => {
    const { 
      frequency = 440, 
      duration = 0.15, 
      type = 'sine',
      volume = 0.3 
    } = options;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Smooth volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, [getAudioContext]);

  const playCorrect = useCallback(() => {
    // Play ascending happy tones (C5 -> E5 -> G5)
    playTone({ frequency: 523.25, duration: 0.1, type: 'sine', volume: 0.25 });
    setTimeout(() => playTone({ frequency: 659.25, duration: 0.1, type: 'sine', volume: 0.25 }), 80);
    setTimeout(() => playTone({ frequency: 783.99, duration: 0.2, type: 'sine', volume: 0.3 }), 160);
  }, [playTone]);

  const playWrong = useCallback(() => {
    // Play descending sad tones
    playTone({ frequency: 300, duration: 0.15, type: 'sawtooth', volume: 0.2 });
    setTimeout(() => playTone({ frequency: 250, duration: 0.2, type: 'sawtooth', volume: 0.15 }), 100);
  }, [playTone]);

  const playTick = useCallback(() => {
    playTone({ frequency: 800, duration: 0.05, type: 'square', volume: 0.1 });
  }, [playTone]);

  const playUrgent = useCallback(() => {
    playTone({ frequency: 880, duration: 0.08, type: 'square', volume: 0.15 });
  }, [playTone]);

  const playComplete = useCallback(() => {
    // Victory fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone({ frequency: freq, duration: 0.15, type: 'sine', volume: 0.25 }), i * 120);
    });
  }, [playTone]);

  return {
    playCorrect,
    playWrong,
    playTick,
    playUrgent,
    playComplete,
  };
};
