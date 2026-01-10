import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Save, 
  X, 
  Plus, 
  Palette, 
  Calendar,
  Clock,
  Check,
  Droplet,
  Dumbbell,
  BookOpen,
  Brain,
  Heart,
  Leaf,
  Moon,
  Sun,
  Coffee,
  Music,
  Pencil,
  Target,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { FolderKanban, AlertCircle } from "lucide-react";

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => Promise<Habit | null>;
  habit?: Habit; // For edit mode
  canAddHabit: boolean;
  remainingHabits: number;
}

const colorOptions = [
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#f97316', label: 'Laranja' },
];

const iconOptions = [
  { value: 'check', label: 'Check', icon: Check },
  { value: 'droplet', label: 'Água', icon: Droplet },
  { value: 'dumbbell', label: 'Exercício', icon: Dumbbell },
  { value: 'book-open', label: 'Leitura', icon: BookOpen },
  { value: 'brain', label: 'Mente', icon: Brain },
  { value: 'heart', label: 'Saúde', icon: Heart },
  { value: 'leaf', label: 'Natureza', icon: Leaf },
  { value: 'moon', label: 'Sono', icon: Moon },
  { value: 'sun', label: 'Sol', icon: Sun },
  { value: 'coffee', label: 'Café', icon: Coffee },
  { value: 'music', label: 'Música', icon: Music },
  { value: 'pencil', label: 'Escrever', icon: Pencil },
  { value: 'target', label: 'Meta', icon: Target },
  { value: 'flame', label: 'Fogo', icon: Flame },
];

const frequencyOptions = [
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'specific_days', label: 'Dias específicos' },
];

const weekDays = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export function HabitFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  habit,
  canAddHabit,
  remainingHabits 
}: HabitFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('check');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'specific_days'>('daily');
  const [specificDays, setSpecificDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [color, setColor] = useState('#8B5CF6');
  const [reminderTime, setReminderTime] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const { projects } = useProjects();

  const isEditMode = !!habit;

  // Populate form when editing
  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description || '');
      setIcon(habit.icon || 'check');
      setFrequency(habit.frequency);
      setSpecificDays(habit.specificDays || [1, 2, 3, 4, 5]);
      setColor(habit.color);
      setReminderTime(habit.reminderTime || '');
      setProjectId(habit.projectId);
    } else {
      resetForm();
    }
  }, [habit, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIcon('check');
    setFrequency('daily');
    setSpecificDays([1, 2, 3, 4, 5]);
    setColor('#8B5CF6');
    setReminderTime('');
    setProjectId(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleDay = (day: number) => {
    setSpecificDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (!isEditMode && !canAddHabit) return;

    setIsSaving(true);

    const result = await onSave({
      id: habit?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      frequency,
      specificDays: frequency === 'specific_days' ? specificDays : undefined,
      color,
      reminderTime: reminderTime || undefined,
      projectId,
    });

    setIsSaving(false);

    if (result) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {isEditMode ? 'Editar Hábito' : 'Novo Hábito'}
          </DialogTitle>
        </DialogHeader>

        {/* 5 habit limit warning */}
        {!isEditMode && !canAddHabit && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Limite atingido!</p>
              <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                Foco é poder! 🎯 Mantenha no máximo 5 hábitos para não se sobrecarregar.
              </p>
            </div>
          </div>
        )}

        {!isEditMode && canAddHabit && remainingHabits <= 2 && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-muted-foreground text-sm">
            <Target className="h-4 w-4" />
            Você pode adicionar mais {remainingHabits} hábito{remainingHabits !== 1 ? 's' : ''}.
          </div>
        )}

        <div className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="habit-title">Nome do Hábito *</Label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Beber 2L de água"
              autoFocus
              disabled={!isEditMode && !canAddHabit}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="habit-description">Descrição (opcional)</Label>
            <Textarea
              id="habit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por que esse hábito é importante para você?"
              rows={2}
              disabled={!isEditMode && !canAddHabit}
            />
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIcon(opt.value)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all",
                      icon === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/50"
                    )}
                    title={opt.label}
                    disabled={!isEditMode && !canAddHabit}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Cor do Hábito
            </Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    color === opt.value 
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" 
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: opt.value }}
                  title={opt.label}
                  disabled={!isEditMode && !canAddHabit}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Frequência
            </Label>
            <Select 
              value={frequency} 
              onValueChange={(v) => setFrequency(v as typeof frequency)}
              disabled={!isEditMode && !canAddHabit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specific days selector */}
          {frequency === 'specific_days' && (
            <div className="space-y-2">
              <Label>Dias da Semana</Label>
              <div className="flex gap-2">
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-medium transition-all",
                      specificDays.includes(day.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/50 text-muted-foreground hover:border-primary/50"
                    )}
                    disabled={!isEditMode && !canAddHabit}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reminder time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário de Lembrete (opcional)
            </Label>
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              disabled={!isEditMode && !canAddHabit}
            />
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Projeto (opcional)
            </Label>
            <Select 
              value={projectId || "none"} 
              onValueChange={(v) => setProjectId(v === "none" ? undefined : v)}
              disabled={!isEditMode && !canAddHabit}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Selecionar projeto..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum Projeto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || isSaving || (!isEditMode && !canAddHabit)}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : isEditMode ? 'Salvar' : 'Criar Hábito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
