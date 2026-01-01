"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabaseDb } from "@/lib/supabase/index";
import { useTimer } from "@/contexts/TimerContext"; // Importando o useTimer

interface TimerSettingsCardProps {
  userId: string | undefined;
}

const TimerSettingsCard = ({ userId }: TimerSettingsCardProps) => {
  const { refreshSettings } = useTimer(); // Obtendo a função refreshSettings do contexto
  const [isEditing, setIsEditing] = useState(false);
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchTimerSettings = useCallback(async () => {
    if (!userId) return;
    setLoadingSettings(true);
    const data = await supabaseDb.getProfile(userId);
    if (data) {
      setPomodoroDuration(data.pomodoro_duration || 25);
      setShortBreakDuration(data.short_break_duration || 5);
      setLongBreakDuration(data.long_break_duration || 15);
      setSoundEnabled(data.enable_sound_notifications ?? true);
    }
    setLoadingSettings(false);
  }, [userId]);

  useEffect(() => {
    fetchTimerSettings();
  }, [fetchTimerSettings]);

  const handleSaveSettings = async () => {
    if (!userId) {
      toast.error("Você precisa estar logado para salvar as configurações do timer.");
      return;
    }

    const success = await supabaseDb.updateProfile(userId, {
      pomodoro_duration: pomodoroDuration,
      short_break_duration: shortBreakDuration,
      long_break_duration: longBreakDuration,
      enable_sound_notifications: soundEnabled,
    });

    if (success) {
      toast.success("Configurações do timer atualizadas com sucesso!");
      setIsEditing(false);
      refreshSettings(); // Recarrega as configurações no contexto do timer
    } else {
      toast.error("Falha ao atualizar as configurações do timer.");
    }
  };

  if (loadingSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Timer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Configurações do Timer</CardTitle>
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancelar" : "Editar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>Notificações Sonoras</Label>
              <CardDescription>
                Tocar um som ao final de cada sessão.
              </CardDescription>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              disabled={!isEditing}
            />
          </div>
          <h4 className="text-sm font-semibold text-muted-foreground pt-2">Durações (minutos)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pomodoro_duration">Foco</Label>
              <Input id="pomodoro_duration" type="number" value={pomodoroDuration} onChange={(e) => setPomodoroDuration(Number(e.target.value))} disabled={!isEditing} />
              {isEditing && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => setPomodoroDuration(5)}>5</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPomodoroDuration(15)}>15</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPomodoroDuration(25)}>25</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPomodoroDuration(50)}>50</Button>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="short_break_duration">Pausa Curta</Label>
              <Input id="short_break_duration" type="number" value={shortBreakDuration} onChange={(e) => setShortBreakDuration(Number(e.target.value))} disabled={!isEditing} />
              {isEditing && (
                 <div className="flex flex-wrap gap-2 mt-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => setShortBreakDuration(3)}>3</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShortBreakDuration(5)}>5</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShortBreakDuration(10)}>10</Button>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="long_break_duration">Pausa Longa</Label>
              <Input id="long_break_duration" type="number" value={longBreakDuration} onChange={(e) => setLongBreakDuration(Number(e.target.value))} disabled={!isEditing} />
              {isEditing && (
                 <div className="flex flex-wrap gap-2 mt-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => setLongBreakDuration(15)}>15</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setLongBreakDuration(20)}>20</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setLongBreakDuration(30)}>30</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <Button onClick={handleSaveSettings} className="w-full">
            Salvar Alterações
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TimerSettingsCard;