import { FileText, Pin, Trash2, Pencil, FolderKanban, CheckCircle2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import type { Note } from "@/hooks/useNotes";

interface NoteCardProps {
  note: Note;
  projectName?: string;
  taskTitle?: string;
  areaName?: string;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, currentStatus: boolean) => void;
}

export function NoteCard({
  note,
  projectName,
  taskTitle,
  areaName,
  onEdit,
  onDelete,
  onTogglePin,
}: NoteCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        note.is_pinned && "border-primary/30 bg-primary/5"
      )}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="absolute -top-2 -right-2">
          <Pin className="h-4 w-4 text-primary fill-primary" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-foreground line-clamp-2">{note.title}</h3>
        
        {/* Actions - visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTogglePin(note.id, note.is_pinned)}
            className="h-7 w-7 p-0"
            title={note.is_pinned ? "Desafixar" : "Fixar"}
          >
            <Pin className={cn("h-3.5 w-3.5", note.is_pinned && "fill-current")} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(note)}
            className="h-7 w-7 p-0"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(note.id)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content preview */}
      {note.content && (
        <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-4 mb-3 text-muted-foreground">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      )}

      {/* Audio player if present */}
      {note.audio_url && (
        <audio src={note.audio_url} controls className="w-full h-8 mb-3" />
      )}

      {/* Image gallery if present */}
      {note.image_urls && note.image_urls.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.image_urls.slice(0, 4).map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Attachment ${index + 1}`}
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
              {index === 3 && note.image_urls && note.image_urls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    +{note.image_urls.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Links/Associations */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {projectName && (
          <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
            <FolderKanban className="h-3 w-3" />
            {projectName}
          </span>
        )}
        {taskTitle && (
          <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            {taskTitle}
          </span>
        )}
        {areaName && (
          <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
            <Target className="h-3 w-3" />
            {areaName}
          </span>
        )}
      </div>

      {/* Date */}
      <p className="text-xs text-muted-foreground mt-3">
        {new Date(note.updated_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}
