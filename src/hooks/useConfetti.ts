/**
 * Confetti Effects Hook
 * Beautiful confetti animations for quiz celebrations
 */

import { useCallback } from 'react';
import confetti from 'canvas-confetti';

// House color schemes
const houseConfettiColors: Record<string, string[]> = {
  AbuBakr: ['#10b981', '#059669', '#34d399', '#6ee7b7'],
  Umar: ['#3b82f6', '#2563eb', '#60a5fa', '#93c5fd'],
  Uthman: ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d'],
  Ali: ['#f43f5e', '#e11d48', '#fb7185', '#fda4af'],
};

export const useConfetti = () => {
  // Basic confetti burst
  const fireConfetti = useCallback((options: confetti.Options = {}) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      ...options,
    });
  }, []);

  // Correct answer celebration
  const celebrateCorrect = useCallback((house?: string) => {
    const colors = house && houseConfettiColors[house] 
      ? houseConfettiColors[house] 
      : ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'];

    // Center burst
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.5, x: 0.5 },
      colors,
      ticks: 200,
      gravity: 1.2,
      scalar: 1.2,
    });
  }, []);

  // Perfect score celebration
  const celebratePerfect = useCallback((house?: string) => {
    const colors = house && houseConfettiColors[house] 
      ? houseConfettiColors[house] 
      : ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#fcd34d'];

    const end = Date.now() + 2000;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Quiz completion celebration
  const celebrateCompletion = useCallback((score: number, total: number, house?: string) => {
    const percentage = (score / total) * 100;
    const colors = house && houseConfettiColors[house] 
      ? houseConfettiColors[house] 
      : ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'];

    if (percentage === 100) {
      // Perfect score - epic celebration
      celebratePerfect(house);
    } else if (percentage >= 80) {
      // Great score - double burst
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.4 },
        colors,
        ticks: 300,
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.5 },
          colors,
        });
      }, 200);
    } else if (percentage >= 60) {
      // Good score - simple burst
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
        colors,
      });
    }
  }, [celebratePerfect]);

  // Fireworks effect
  const fireFireworks = useCallback((house?: string) => {
    const colors = house && houseConfettiColors[house] 
      ? houseConfettiColors[house] 
      : ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'];

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, colors };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  // Stars/sparkles effect
  const fireStars = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'] as confetti.Shape[],
      colors: ['#ffd700', '#ffb700', '#ff9500'],
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star'] as confetti.Shape[],
      });
      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle'] as confetti.Shape[],
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  }, []);

  return {
    fireConfetti,
    celebrateCorrect,
    celebratePerfect,
    celebrateCompletion,
    fireFireworks,
    fireStars,
  };
};
