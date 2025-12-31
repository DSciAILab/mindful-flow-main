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
import { 
  Save, 
  X,
  AlertCircle,
  Zap,
  Flag,
  Leaf,
  Tag,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, Priority, TaskStatus, Project } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { FolderKanban } from "lucide-react";

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<Task | null>;
}

const priorityOptions: { value: Priority; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'urgent', label: 'Urgente', icon: AlertCircle, color: 'text-red-500' },
  { value: 'high', label: 'Alta', icon: Zap, color: 'text-orange-500' },
  { value: 'medium', label: 'Média', icon: Flag, color: 'text-yellow-500' },
  { value: 'low', label: 'Baixa', icon: Leaf, color: 'text-emerald-500' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'next', label: 'Próximas' },
  { value: 'in-progress', label: 'Em Progresso' },
  { value: 'scheduled', label: 'Agendadas' },
  { value: 'someday', label: 'Algum dia' },
];

export function TaskCreateModal({ isOpen, onClose, onSave }: TaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('next');
  const [tagsInput, setTagsInput] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const { projects } = useProjects();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('next');
    setTagsInput('');
    setEstimatedMinutes(undefined);
    setProjectId(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const result = await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      tags,
      estimatedMinutes,
      projectId,
      points: priority === 'urgent' ? 25 : priority === 'high' ? 20 : priority === 'medium' ? 15 : 10,
    });

    setIsSaving(false);
    
    if (result) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que você precisa fazer?"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa (opcional)"
              rows={3}
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", opt.color)} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="trabalho, pessoal, projeto (separadas por vírgula)"
            />
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

          {/* Estimated time */}
          <div className="space-y-2">
            <Label htmlFor="estimated">Tempo estimado (minutos)</Label>
            <Input
              id="estimated"
              type="number"
              value={estimatedMinutes || ''}
              onChange={(e) => setEstimatedMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="30"
              min={1}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
