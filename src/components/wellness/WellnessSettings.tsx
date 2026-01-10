import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Droplets,
  Eye,
  PersonStanding,
  Clock,
  Moon,
  Timer,
  Save,
} from 'lucide-react';
import type { WellnessConfig } from '@/types/wellness';

interface WellnessSettingsProps {
  config: WellnessConfig | null;
  onSave: (updates: Partial<WellnessConfig>) => Promise<boolean>;
  loading?: boolean;
}

interface ReminderSettingProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  intervalMinutes: number;
  color: string;
  onEnabledChange: (enabled: boolean) => void;
  onIntervalChange: (minutes: number) => void;
}

function ReminderSetting({
  icon: Icon,
  label,
  description,
  enabled,
  intervalMinutes,
  color,
  onEnabledChange,
  onIntervalChange,
}: ReminderSettingProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        enabled ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <Label className="text-base font-medium">{label}</Label>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {enabled && (
        <div className="mt-4 pl-13">
          <div className="flex items-center gap-4">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Slider
                value={[intervalMinutes]}
                onValueChange={([value]) => onIntervalChange(value)}
                min={15}
                max={120}
                step={5}
                className="w-full"
              />
            </div>
            <span className="w-16 text-right text-sm font-medium tabular-nums">
              {intervalMinutes} min
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function WellnessSettings({ config, onSave, loading }: WellnessSettingsProps) {
  const [localConfig, setLocalConfig] = useState<Partial<WellnessConfig>>({});
  const [saving, setSaving] = useState(false);

  if (!config) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Carregando configurações...
      </div>
    );
  }

  const currentConfig = { ...config, ...localConfig };

  const handleChange = <K extends keyof WellnessConfig>(
    key: K,
    value: WellnessConfig[K]
  ) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (Object.keys(localConfig).length === 0) return;
    
    setSaving(true);
    const success = await onSave(localConfig);
    if (success) {
      setLocalConfig({});
    }
    setSaving(false);
  };

  const hasChanges = Object.keys(localConfig).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Lembretes de Bem-estar</h3>
        <p className="text-sm text-muted-foreground">
          Configure lembretes gentis para autocuidado durante o dia
        </p>
      </div>

      {/* Reminder types */}
      <div className="space-y-3">
        <ReminderSetting
          icon={Droplets}
          label="Hidratação"
          description="Lembrete para beber água"
          enabled={currentConfig.waterEnabled}
          intervalMinutes={currentConfig.waterIntervalMinutes}
          color="#3B82F6"
          onEnabledChange={(v) => handleChange('waterEnabled', v)}
          onIntervalChange={(v) => handleChange('waterIntervalMinutes', v)}
        />

        <ReminderSetting
          icon={PersonStanding}
          label="Alongamento"
          description="Pausa para alongar o corpo"
          enabled={currentConfig.stretchEnabled}
          intervalMinutes={currentConfig.stretchIntervalMinutes}
          color="#10B981"
          onEnabledChange={(v) => handleChange('stretchEnabled', v)}
          onIntervalChange={(v) => handleChange('stretchIntervalMinutes', v)}
        />

        <ReminderSetting
          icon={Eye}
          label="Descanso Visual"
          description="Regra 20-20-20 para os olhos"
          enabled={currentConfig.eyesEnabled}
          intervalMinutes={currentConfig.eyesIntervalMinutes}
          color="#8B5CF6"
          onEnabledChange={(v) => handleChange('eyesEnabled', v)}
          onIntervalChange={(v) => handleChange('eyesIntervalMinutes', v)}
        />

        <ReminderSetting
          icon={PersonStanding}
          label="Postura"
          description="Verificar e corrigir postura"
          enabled={currentConfig.postureEnabled}
          intervalMinutes={currentConfig.postureIntervalMinutes}
          color="#F59E0B"
          onEnabledChange={(v) => handleChange('postureEnabled', v)}
          onIntervalChange={(v) => handleChange('postureIntervalMinutes', v)}
        />
      </div>

      {/* Quiet hours */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
            <Moon className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <Label className="text-base font-medium">Horário de Silêncio</Label>
            <p className="text-sm text-muted-foreground">
              Não mostrar lembretes durante este período
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Das</Label>
            <Input
              type="time"
              value={currentConfig.quietHoursStart}
              onChange={(e) => handleChange('quietHoursStart', e.target.value)}
              className="w-28"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">às</Label>
            <Input
              type="time"
              value={currentConfig.quietHoursEnd}
              onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
              className="w-28"
            />
          </div>
        </div>
      </div>

      {/* Focus mode integration */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
            <Clock className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <Label className="text-base font-medium">Mostrar Durante Foco</Label>
            <p className="text-sm text-muted-foreground">
              Exibir lembretes mesmo durante sessões de foco
            </p>
          </div>
        </div>
        <Switch
          checked={currentConfig.showDuringFocus}
          onCheckedChange={(v) => handleChange('showDuringFocus', v)}
        />
      </div>

      {/* Save button */}
      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      )}
    </div>
  );
}
