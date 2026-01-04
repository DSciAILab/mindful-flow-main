import { Button } from "@/components/ui/button";
import { 
  Inbox, 
  ChevronRight, 
  Type, 
  Mic, 
  Camera,
  Sparkles,
  Clock,
  Trash2,
  Pencil,
  Save,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CaptureItem } from "@/types";

interface InboxPreviewProps {
  items: CaptureItem[];
  onViewAll: () => void;
  onProcess: (item: CaptureItem) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, content: string) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  text: Type,
  audio: Mic,
  photo: Camera,
  video: Camera,
  canvas: Type,
};

export function InboxPreview({ items, onViewAll, onProcess, onDelete, onUpdate }: InboxPreviewProps) {
  const unprocessedCount = items.filter(i => !i.processed).length;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleStartEdit = (item: CaptureItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const handleSaveEdit = (id: string) => {
    if (onUpdate) {
      onUpdate(id, editContent);
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Inbox</h3>
          {unprocessedCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {unprocessedCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          Ver tudo
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {items.slice(0, 3).map((item) => {
          const Icon = typeIcons[item.type] || Type;
          const timeAgo = getTimeAgo(item.createdAt);

          return (
            <div
              key={item.id}
              className={cn(
                "group flex items-start gap-3 rounded-xl p-3 transition-all duration-200",
                item.processed 
                  ? "bg-muted/30" 
                  : "bg-primary/5 hover:bg-primary/10"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                item.processed ? "bg-muted" : "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-4 w-4",
                  item.processed ? "text-muted-foreground" : "text-primary"
                )} />
              </div>

              <div className="min-w-0 flex-1">
                <div className={cn(
                  "text-sm",
                  item.processed ? "text-muted-foreground" : "text-foreground"
                )}>
                  {editingId === item.id ? (
                    <div className="space-y-2">
                       <Textarea 
                         value={editContent}
                         onChange={(e) => setEditContent(e.target.value)}
                         className="min-h-[80px] bg-background"
                         onClick={(e) => e.stopPropagation()}
                       />
                       <div className="flex gap-2">
                         <Button size="sm" onClick={() => handleSaveEdit(item.id)} className="h-7 px-2">
                           <Save className="mr-1 h-3 w-3" /> Salvar
                         </Button>
                         <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 px-2">
                           <X className="mr-1 h-3 w-3" /> Cancelar
                         </Button>
                       </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{item.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {item.audioUrl && (
                   <audio 
                     src={item.audioUrl} 
                     controls 
                     className="mt-2 h-6 w-full max-w-[180px]" 
                     onClick={(e) => e.stopPropagation()}
                   />
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{timeAgo}</span>
                  <span className="opacity-60">•</span>
                  <span className="opacity-60">{formatCaptureDate(item.createdAt)}</span>
                </div>
              </div>

              {!item.processed && (
                <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onProcess(item)}
                    title="Processar"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </Button>
                  {!item.processed && onUpdate && !editingId && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(item);
                      }}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(item.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="py-6 text-center">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Inbox vazio! Capture algo novo.
          </p>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatCaptureDate(date: Date): string {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  const currentYear = new Date().getFullYear();
  
  if (year === currentYear) {
    return `${day} ${month}, ${hours}:${minutes}`;
  }
  return `${day} ${month} ${year}`;
}
