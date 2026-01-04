import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  FolderKanban,
  Loader2,
  Zap,
  AlertCircle,
  Flag,
  Leaf
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { CaptureItem, Priority, Project } from "@/types";

interface ProcessInboxModalProps {
  item: CaptureItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (title: string, description: string, priority: Priority) => void;
  onCreateNote?: (title: string, content: string, projectId?: string) => void;
  onCreateProject?: (title: string, description: string) => void;
  onMarkProcessed: (id: string) => void;
  projects?: Project[];
}

type SuggestionType = "task" | "note" | "project";

interface AISuggestion {
  type: SuggestionType;
  title: string;
  description?: string;
  priority?: Priority;
}

const typeIcons = {
  task: CheckCircle2,
  note: FileText,
  project: FolderKanban,
};

const typeLabels = {
  task: "Tarefa",
  note: "Nota",
  project: "Projeto",
};

const priorityOptions: { value: Priority; label: string; icon: React.ElementType }[] = [
  { value: "urgent", label: "Urgente", icon: AlertCircle },
  { value: "high", label: "Alta", icon: Zap },
  { value: "medium", label: "Média", icon: Flag },
  { value: "low", label: "Baixa", icon: Leaf },
];

export function ProcessInboxModal({
  item,
  isOpen,
  onClose,
  onCreateTask,
  onCreateNote,
  onCreateProject,
  onMarkProcessed,
  projects = [],
}: ProcessInboxModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [selectedType, setSelectedType] = useState<SuggestionType>("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");

  // Analyze content when modal opens
  useEffect(() => {
    if (item && isOpen) {
      analyzeContent(item.content);
    }
  }, [item, isOpen]);

  const analyzeContent = async (content: string) => {
    setIsAnalyzing(true);
    
    // Simple heuristic analysis (can be replaced with AI API call)
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate AI thinking
    
    const lowerContent = content.toLowerCase();
    
    let type: SuggestionType = "note";
    let suggestedPriority: Priority = "medium";
    let suggestedTitle = content.slice(0, 50);
    
    // Detect task patterns
    const taskPatterns = [
      /^(fazer|comprar|ligar|enviar|preparar|agendar|marcar|verificar|revisar|criar|terminar)/i,
      /(amanhã|hoje|urgente|importante|lembrar|não esquecer)/i,
      /^(preciso|tenho que|devo|necessito)/i,
    ];
    
    // Detect project patterns
    const projectPatterns = [
      /(projeto|plano|ideia para|novo negócio|iniciativa)/i,
      /(longo prazo|metas|objetivos|estratégia)/i,
    ];
    
    // Check for urgency
    if (/(urgente|agora|imediato|hoje)/i.test(lowerContent)) {
      suggestedPriority = "urgent";
    } else if (/(importante|alta prioridade)/i.test(lowerContent)) {
      suggestedPriority = "high";
    } else if (/(quando puder|baixa|eventual)/i.test(lowerContent)) {
      suggestedPriority = "low";
    }
    
    // Determine type
    if (taskPatterns.some(pattern => pattern.test(content))) {
      type = "task";
      // Clean up title for tasks
      suggestedTitle = content
        .replace(/^(preciso|tenho que|devo|necessito)\s+/i, "")
        .replace(/^(lembrar de|não esquecer de)\s+/i, "")
        .slice(0, 60);
    } else if (projectPatterns.some(pattern => pattern.test(content))) {
      type = "project";
    }
    
    const newSuggestion: AISuggestion = {
      type,
      title: suggestedTitle,
      description: content,
      priority: suggestedPriority,
    };
    
    setSuggestion(newSuggestion);
    setSelectedType(type);
    setTitle(suggestedTitle);
    setDescription(content);
    setPriority(suggestedPriority);
    setIsAnalyzing(false);
  };

  const handleCreate = () => {
    if (!item) return;
    
    if (selectedType === "task") {
      onCreateTask(title, description, priority);
    } else if (selectedType === "note" && onCreateNote) {
      onCreateNote(title, description, selectedProjectId === "none" ? undefined : selectedProjectId);
    } else if (selectedType === "project" && onCreateProject) {
      onCreateProject(title, description);
    }
    
    onMarkProcessed(item.id);
    handleClose();
  };

  const handleClose = () => {
    setSuggestion(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setSelectedProjectId("none");
    setSelectedType("task");
    onClose();
  };

  const TypeIcon = typeIcons[selectedType];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Processar com IA
          </DialogTitle>
          <DialogDescription>
            A IA analisou o conteúdo e sugeriu uma conversão
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Analisando conteúdo...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Original content preview */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Conteúdo original:</p>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-sm">
                <ReactMarkdown>{item?.content || ""}</ReactMarkdown>
              </div>
            </div>

            {/* Type selection */}
            <div className="space-y-2">
              <Label>Converter para:</Label>
              <div className="flex gap-2">
                {(Object.keys(typeLabels) as SuggestionType[]).map((type) => {
                  const Icon = typeIcons[type];
                  const isSelected = selectedType === type;
                  return (
                    <Button
                      key={type}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "flex-1",
                        isSelected && "ring-2 ring-primary/20"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {typeLabels[type]}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título..."
              />
            </div>

            {/* Project Selection (for Notes) */}
            {selectedType === "note" && projects.length > 0 && (
              <div className="space-y-2">
                <Label>Projeto (Opcional)</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem projeto</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description (for tasks) */}
            {selectedType === "task" && (
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional..."
                  rows={2}
                />
              </div>
            )}

            {/* Priority (for tasks) */}
            {selectedType === "task" && (
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => {
                      const PriorityIcon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <PriorityIcon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isAnalyzing || !title.trim()}
          >
            <TypeIcon className="mr-2 h-4 w-4" />
            Criar {typeLabels[selectedType]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
