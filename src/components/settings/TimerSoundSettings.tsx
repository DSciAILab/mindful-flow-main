import { useState } from 'react';
import { useTimerSounds, SOUND_OPTIONS } from '@/hooks/useTimerSounds';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Play, Check, Bell } from 'lucide-react';

export function TimerSoundSettings() {
  const { settings, saveSettings, previewSound, loading } = useTimerSounds();
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  const handlePreview = (soundId: string) => {
    setPlayingPreview(soundId);
    previewSound(soundId);
    setTimeout(() => setPlayingPreview(null), 1500);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-10 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable sounds */}
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <Volume2 className="h-5 w-5 text-primary" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <Label className="text-sm font-medium">Sons do Timer</Label>
            <p className="text-xs text-muted-foreground">
              Tocar sons quando o timer terminar
            </p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(enabled) => saveSettings({ enabled })}
        />
      </div>

      {settings.enabled && (
        <>
          {/* Volume slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Volume</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.volume * 100]}
              onValueChange={([value]) => saveSettings({ volume: value / 100 })}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
          </div>

          {/* Focus end sound selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Som ao Terminar Foco</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOUND_OPTIONS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    saveSettings({ focusEndSound: sound.id });
                    if (sound.id !== 'none') handlePreview(sound.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left transition-all",
                    settings.focusEndSound === sound.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{sound.name}</span>
                      {settings.focusEndSound === sound.id && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sound.description}
                    </span>
                  </div>
                  {sound.id !== 'none' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(sound.id);
                      }}
                      className="flex-shrink-0"
                    >
                      <Play className={cn(
                        "h-3.5 w-3.5",
                        playingPreview === sound.id && "animate-pulse text-primary"
                      )} />
                    </Button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Break end sound selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Som ao Terminar Pausa</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOUND_OPTIONS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    saveSettings({ breakEndSound: sound.id });
                    if (sound.id !== 'none') handlePreview(sound.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left transition-all",
                    settings.breakEndSound === sound.id
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border hover:border-accent/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{sound.name}</span>
                      {settings.breakEndSound === sound.id && (
                        <Check className="h-3 w-3 text-accent" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sound.description}
                    </span>
                  </div>
                  {sound.id !== 'none' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(sound.id);
                      }}
                      className="flex-shrink-0"
                    >
                      <Play className={cn(
                        "h-3.5 w-3.5",
                        playingPreview === sound.id && "animate-pulse text-accent"
                      )} />
                    </Button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Test button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => handlePreview(settings.focusEndSound)}
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              Testar Som Atual
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
