"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smile, Frown, Meh, Laugh, Angry, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabaseDb } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

type Mood = "radiante" | "bem" | "neutro" | "mal" | "terrível";

interface MoodOption {
  mood: Mood;
  icon: React.ElementType;
  label: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { mood: "radiante", icon: Laugh, label: "Radiante", color: "text-green-500" },
  { mood: "bem", icon: Smile, label: "Bem", color: "text-sky-500" },
  { mood: "neutro", icon: Meh, label: "Neutro", color: "text-yellow-500" },
  { mood: "mal", icon: Frown, label: "Mal", color: "text-orange-500" },
  { mood: "terrível", icon: Angry, label: "Terrível", color: "text-red-500" },
];

interface MoodLog {
  mood: Mood;
  created_at: string;
}

interface DailyMoodTrackerProps {
  userId: string | undefined;
}

const DailyMoodTracker = ({ userId }: DailyMoodTrackerProps) => {
  const [currentMood, setCurrentMood] = useState<MoodLog | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodaysMoods = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const [latestLog, historyLogs] = await Promise.all([
      supabaseDb.getTodaysMoodLog(userId),
      supabaseDb.getTodaysMoodLogs(userId),
    ]);
    setCurrentMood(latestLog as MoodLog | null);
    setMoodHistory(historyLogs as MoodLog[]);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTodaysMoods();
  }, [fetchTodaysMoods]);

  const handleLogMood = async (mood: Mood) => {
    if (!userId) return;

    const newLog: MoodLog = { mood, created_at: new Date().toISOString() };
    
    // Optimistic UI update
    setCurrentMood(newLog);
    setMoodHistory(prev => [newLog, ...prev]);

    const success = await supabaseDb.addMoodLog(userId, mood, "");
    if (success) {
      toast.success("Humor registrado!");
    } else {
      toast.error("Falha ao registrar o humor.");
      // Revert UI on failure
      fetchTodaysMoods();
    }
  };

  const CurrentMoodDisplay = () => {
    if (isLoading) {
      return <Skeleton className="h-12 w-full" />;
    }
    if (!currentMood) {
      return <p className="text-center text-muted-foreground">Como você está se sentindo agora?</p>;
    }
    const moodOption = moodOptions.find(opt => opt.mood === currentMood.mood);
    const Icon = moodOption?.icon || Meh;
    return (
      <div className="flex items-center justify-center gap-4 p-2 rounded-lg bg-accent">
        <Icon className={cn("h-10 w-10", moodOption?.color)} />
        <div>
          <p className="text-lg font-bold capitalize">{moodOption?.label}</p>
          <p className="text-xs text-muted-foreground">
            Registrado às {format(new Date(currentMood.created_at), "HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="mx-4 mt-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Monitor de Humor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CurrentMoodDisplay />
        <div className="flex justify-around">
          {moodOptions.map(({ mood, icon: Icon, label, color }) => (
            <Button
              key={mood}
              variant="ghost"
              onClick={() => handleLogMood(mood)}
              className="flex flex-col items-center h-auto p-2 gap-1 transition-transform transform hover:scale-110"
            >
              <Icon className={cn("h-8 w-8", color)} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </Button>
          ))}
        </div>
        {moodHistory.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-center gap-2">
                Histórico de Hoje ({moodHistory.length})
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-2">
                {moodHistory.map((log, index) => {
                  const moodOption = moodOptions.find(opt => opt.mood === log.mood);
                  const Icon = moodOption?.icon || Meh;
                  return (
                    <li key={index} className="flex items-center gap-3 p-2 bg-muted rounded-md">
                      <Icon className={cn("h-5 w-5", moodOption?.color)} />
                      <span className="text-sm font-medium capitalize">{moodOption?.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyMoodTracker;