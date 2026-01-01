"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface CompletionOverlayProps {
  onClose: () => void;
  xpEarned?: number;
}

export const CompletionOverlay = ({ onClose, xpEarned = 10 }: CompletionOverlayProps) => {
  
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-sm bg-[#1C1C1E] border-none text-white p-8 flex flex-col items-center text-center shadow-2xl rounded-3xl">
        
        {/* Badge Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
          <div className="relative h-20 w-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
             <div className="h-16 w-16 border-4 border-dashed border-white/30 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]"></div>
             <Check className="h-10 w-10 text-white absolute" strokeWidth={4} />
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-2">Well done!</h2>
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          Task Complete! <Trophy className="h-6 w-6 text-yellow-500" />
        </h3>

        <p className="text-gray-400 mb-8">You earned +{xpEarned} XP</p>

        <Button 
          className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold h-12 rounded-xl text-lg transition-all"
          onClick={onClose}
        >
          Finish
        </Button>
      </Card>
    </div>
  );
};