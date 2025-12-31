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
  Trash2, 
  Save, 
  X,
  AlertCircle,
  Zap,
  Flag,
  Leaf,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { TaskAttachments } from "./TaskAttachments";
import type { Task, Priority, TaskStatus } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { FolderKanban } from "lucide-react";

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityOptions: { value: Priority; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'urgent', label: 'Urgente', icon: AlertCircle, color: 'text-red-500' },
  { value: 'high', label: 'Alta', icon: Zap, color: 'text-orange-500' },
  { value: 'medium', label: 'Média', icon: Flag, color: 'text-yellow-500' },
  { value: 'low', label: 'Baixa', icon: Leaf, color: 'text-emerald-500' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'next', label: 'Próximas' },
  { value: 'in-progress', label: 'Em Progresso' },
  { value: 'scheduled', label: 'Agendadas' },
  { value: 'someday', label: 'Algum dia' },
  { value: 'done', label: 'Concluídas' },
];

export function TaskEditModal({ task, isOpen, onClose, onSave, onDelete }: TaskEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('next');
  const [tagsInput, setTagsInput] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { projects } = useProjects();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setTagsInput(task.tags?.join(', ') || '');
      setEstimatedMinutes(task.estimatedMinutes);
      setProjectId(task.projectId);
      setShowDeleteConfirm(false);
    }
  }, [task]);

  const handleSave = () => {
    if (!task || !title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onSave({
      ...task,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      tags,
      estimatedMinutes,
      projectId,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da tarefa"
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

          {/* File Attachments */}
          <div className="border-t pt-4">
            <TaskAttachments taskId={task.id} userId={userId} />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {showDeleteConfirm ? (
            <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-destructive">Excluir esta tarefa?</p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
              <Button variant="outline" onClick={onClose}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!title.trim()}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
