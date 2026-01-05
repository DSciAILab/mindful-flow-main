import { useState, useEffect, useRef } from "react";
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
  Plus, 
  X, 
  Save, 
  FolderKanban, 
  CheckCircle2, 
  Target, 
  Tag,
  Image as ImageIcon,
  Mic,
  Square,
  Loader2
} from "lucide-react";
import { LIFE_AREAS } from "@/lib/lifeAreas";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { NoteInput } from "@/hooks/useNotes";
import type { Project, Task } from "@/types";

interface NoteCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteInput) => Promise<any>;
  projects: Project[];
  tasks: Task[];
  defaultProjectId?: string;
  defaultTaskId?: string;
  defaultAreaId?: string;
}

export function NoteCreateModal({
  isOpen,
  onClose,
  onSave,
  projects,
  tasks,
  defaultProjectId,
  defaultTaskId,
  defaultAreaId,
}: NoteCreateModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId);
  const [taskId, setTaskId] = useState<string | undefined>(defaultTaskId);
  const [areaId, setAreaId] = useState<string>(defaultAreaId || "personal");
  const [tags, setTags] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Image attachments
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Audio recording
  const {
    isRecording,
    recordingTime,
    audioBlob,
    permissionPending,
    permissionDenied,
    startRecording,
    stopRecording,
    discardRecording,
    uploadAudio,
  } = useAudioRecorder();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContent("");
      setProjectId(defaultProjectId);
      setTaskId(defaultTaskId);
      setAreaId(defaultAreaId || "personal");
      setTags("");
      setImageFiles([]);
      setImagePreviews([]);
      discardRecording();
    }
  }, [isOpen, defaultProjectId, defaultTaskId, defaultAreaId]);

  // Filter tasks by selected project
  const filteredTasks = projectId
    ? tasks.filter((t) => t.projectId === projectId)
    : tasks;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setImagePreviews((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    for (const file of imageFiles) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage
          .from("capture-media")
          .upload(fileName, file);

        if (error) {
          console.error("Image upload error:", error);
          continue;
        }

        const { data } = supabase.storage
          .from("capture-media")
          .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
      } catch (err) {
        console.error("Failed to upload image", err);
      }
    }
    return uploadedUrls;
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setProjectId(undefined);
    setTaskId(undefined);
    setAreaId("personal");
    setTags("");
    setImageFiles([]);
    setImagePreviews([]);
    discardRecording();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    setIsUploading(true);

    try {
      // Upload audio if recorded
      let audioUrl: string | undefined;
      if (audioBlob) {
        const url = await uploadAudio(audioBlob);
        if (url) audioUrl = url;
      }

      // Upload images
      const imageUrls = await uploadImages();

      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave({
        title: title.trim(),
        content: content.trim() || undefined,
        audio_url: audioUrl,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        project_id: projectId,
        task_id: taskId,
        area_id: areaId,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      handleClose();
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Nota
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
              placeholder="Título da nota..."
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo (Markdown suportado)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua nota aqui... Markdown é suportado!"
              rows={5}
              className="font-mono text-sm"
            />
          </div>

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="space-y-2">
              <Label>Imagens anexadas</Label>
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative inline-block group">
                    <img
                      src={preview}
                      alt={`Preview ${index}`}
                      className="h-20 w-20 rounded-lg object-cover border border-border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/80 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio recording section */}
          {isRecording ? (
            <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
                <span className="text-lg font-mono font-medium text-foreground">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={stopRecording}>
                <Square className="h-4 w-4 fill-current" />
              </Button>
            </div>
          ) : audioBlob ? (
            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
              <Label className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Áudio gravado
              </Label>
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full h-8" />
              <Button variant="ghost" size="sm" onClick={discardRecording} className="text-destructive">
                <X className="mr-2 h-3 w-3" />
                Descartar áudio
              </Button>
            </div>
          ) : null}

          {/* Attachment buttons */}
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              className="text-muted-foreground"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Adicionar Imagem
            </Button>

            {!isRecording && !audioBlob && !permissionDenied && (
              <Button
                variant="outline"
                size="sm"
                onClick={startRecording}
                disabled={permissionPending}
                className="text-muted-foreground"
              >
                {permissionPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="mr-2 h-4 w-4" />
                )}
                Gravar Áudio
              </Button>
            )}

            {permissionDenied && (
              <span className="text-xs text-destructive">Microfone bloqueado</span>
            )}
          </div>

          {/* Life Area */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Área da Vida
            </Label>
            <Select value={areaId} onValueChange={setAreaId}>
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

          {/* Project */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Vincular a Projeto
            </Label>
            <Select
              value={projectId || "none"}
              onValueChange={(v) => {
                setProjectId(v === "none" ? undefined : v);
                if (v !== projectId) setTaskId(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum projeto</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Vincular a Tarefa
            </Label>
            <Select
              value={taskId || "none"}
              onValueChange={(v) => setTaskId(v === "none" ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tarefa..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma tarefa</SelectItem>
                {filteredTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags (separadas por vírgula)
            </Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ideia, importante, revisão..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving || isUploading}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Salvando..." : "Criar Nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
