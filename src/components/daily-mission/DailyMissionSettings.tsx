import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Sun, 
  ListTodo, 
  Repeat,
  Save
} from "lucide-react";
import type { DailyMissionConfig } from "@/types/dailyMission";

interface DailyMissionSettingsProps {
  config: DailyMissionConfig;
  onSave: (updates: Partial<DailyMissionConfig>) => Promise<boolean>;
}

export function DailyMissionSettings({
  config,
  onSave,
}: DailyMissionSettingsProps) {
  const [maxTasks, setMaxTasks] = useState(config.maxTasks);
  const [showOnStartup, setShowOnStartup] = useState(config.showOnStartup);
  const [includeHabits, setIncludeHabits] = useState(config.includeHabits);
  const [morningCheckinEnabled, setMorningCheckinEnabled] = useState(config.morningCheckinEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = 
    maxTasks !== config.maxTasks ||
    showOnStartup !== config.showOnStartup ||
    includeHabits !== config.includeHabits ||
    morningCheckinEnabled !== config.morningCheckinEnabled;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      maxTasks,
      showOnStartup,
      includeHabits,
      morningCheckinEnabled,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Missão Diária</h3>
          <p className="text-sm text-muted-foreground">
            Configure sua experiência diária
          </p>
        </div>
      </div>

      {/* Max tasks slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <Label>Número máximo de tarefas</Label>
          </div>
          <span className="text-2xl font-bold text-primary">{maxTasks}</span>
        </div>
        <Slider
          value={[maxTasks]}
          onValueChange={([value]) => setMaxTasks(value)}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Quantas tarefas prioritárias mostrar na sua missão diária (1-5)
        </p>
      </div>

      {/* Morning checkin toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Sun className="h-5 w-5 text-orange-500" />
          <div>
            <Label className="font-medium">Check-in matinal</Label>
            <p className="text-sm text-muted-foreground">
              Avaliar energia, humor e sono ao abrir o app
            </p>
          </div>
        </div>
        <Switch
          checked={morningCheckinEnabled}
          onCheckedChange={setMorningCheckinEnabled}
        />
      </div>

      {/* Include habits toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Repeat className="h-5 w-5 text-green-500" />
          <div>
            <Label className="font-medium">Incluir hábitos</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar hábitos do dia na missão
            </p>
          </div>
        </div>
        <Switch
          checked={includeHabits}
          onCheckedChange={setIncludeHabits}
        />
      </div>

      {/* Show on startup toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <Label className="font-medium">Mostrar ao abrir</Label>
            <p className="text-sm text-muted-foreground">
              Exibir a missão do dia no topo do dashboard
            </p>
          </div>
        </div>
        <Switch
          checked={showOnStartup}
          onCheckedChange={setShowOnStartup}
        />
      </div>

      {/* Save button */}
      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </Button>
      )}
    </div>
  );
}
