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
import { Plus, X, Save, Palette, FileEdit, TrendingUp, Target } from "lucide-react";
import { LIFE_AREAS } from "@/lib/lifeAreas";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";
import { useAnnualGoals } from "@/hooks/useAnnualGoals";

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => Promise<Project | null> | void | Promise<void>;
  projectToEdit?: Project | null;
}

const colors = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

export function ProjectCreateModal({ isOpen, onClose, onSave, projectToEdit }: ProjectCreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [lifeAreaId, setLifeAreaId] = useState<string | undefined>(undefined);
  const [goalId, setGoalId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const { goals } = useAnnualGoals(currentYear);

  // Populate form when projectToEdit changes or modal opens
  useEffect(() => {
    if (isOpen && projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || "");
      setColor(projectToEdit.color);
      setLifeAreaId(projectToEdit.areaId);
      setGoalId(projectToEdit.goalId);
    } else if (isOpen && !projectToEdit) {
      resetForm();
    }
  }, [isOpen, projectToEdit]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(colors[0]);
    setLifeAreaId(undefined);
    setGoalId(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      areaId: lifeAreaId,
      goalId: goalId,
    });

    setIsSaving(false);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {projectToEdit ? (
              <>
                <FileEdit className="h-5 w-5 text-primary" />
                Editar Projeto
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                Novo Projeto
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Redesign do Site"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que é este projeto?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Área da Roda da Vida
            </Label>
            <Select value={lifeAreaId} onValueChange={setLifeAreaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma área..." />
              </SelectTrigger>
              <SelectContent>
                {LIFE_AREAS.map((area) => {
                  const Icon = area.icon;
                  return (
                    <SelectItem key={area.id} value={area.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: area.color }} />
                        <span>{area.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Vincular a Meta Anual ({currentYear})
            </Label>
            <Select value={goalId || 'none'} onValueChange={(v) => setGoalId(v === 'none' ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma meta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma meta</SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Cor do Projeto
            </Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c ? "border-foreground scale-110 shadow-md" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
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
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvando..." : (projectToEdit ? "Salvar Alterações" : "Criar Projeto")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
