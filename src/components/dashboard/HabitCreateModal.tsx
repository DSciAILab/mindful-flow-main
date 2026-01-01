import { useState } from "react";
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
import { Save, X, Plus, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { FolderKanban } from "lucide-react";

interface HabitCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => Promise<Habit | null>;
}

const colorOptions = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#f97316', label: 'Laranja' },
];

const frequencyOptions = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
];

export function HabitCreateModal({ isOpen, onClose, onSave }: HabitCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [color, setColor] = useState('#3b82f6');
  const [projectId, setProjectId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const { projects } = useProjects();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFrequency('daily');
    setColor('#3b82f6');
    setProjectId(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);

    const result = await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      frequency,
      color,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Novo Hábito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="habit-title">Nome do Hábito *</Label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Beber 2L de água"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="habit-description">Descrição</Label>
            <Textarea
              id="habit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por que esse hábito é importante para você? (opcional)"
              rows={2}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly')}>
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

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Projeto
            </Label>
            <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? undefined : v)}>
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
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Criar Hábito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
