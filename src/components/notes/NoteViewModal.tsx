import { X, Pin, Pencil, Trash2, FolderKanban, CheckCircle2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import type { Note } from "@/hooks/useNotes";

interface NoteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  projectName?: string;
  taskTitle?: string;
  areaName?: string;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, currentStatus: boolean) => void;
}

export function NoteViewModal({
  isOpen,
  onClose,
  note,
  projectName,
  taskTitle,
  areaName,
  onEdit,
  onDelete,
  onTogglePin,
}: NoteViewModalProps) {
  if (!note) return null;

  const handleEdit = () => {
    onEdit(note);
    onClose();
  };

  const handleDelete = () => {
    onDelete(note.id);
    onClose();
  };

  const handleTogglePin = () => {
    onTogglePin(note.id, note.is_pinned);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {note.is_pinned && (
                  <Pin className="h-4 w-4 text-primary fill-primary flex-shrink-0" />
                )}
                <DialogTitle className="text-xl font-semibold truncate">
                  {note.title}
                </DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(note.updated_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTogglePin}
                className="h-8 w-8 p-0"
                title={note.is_pinned ? "Desafixar" : "Fixar"}
              >
                <Pin className={cn("h-4 w-4", note.is_pinned && "fill-current")} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4 overflow-auto">
          {/* Associations */}
          {(projectName || taskTitle || areaName) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {projectName && (
                <span className="flex items-center gap-1.5 text-sm bg-muted/50 px-3 py-1 rounded-full">
                  <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                  {projectName}
                </span>
              )}
              {taskTitle && (
                <span className="flex items-center gap-1.5 text-sm bg-muted/50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {taskTitle}
                </span>
              )}
              {areaName && (
                <span className="flex items-center gap-1.5 text-sm bg-muted/50 px-3 py-1 rounded-full">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  {areaName}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {note.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Main Content */}
          {note.content && (
            <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
              <ReactMarkdown>{note.content}</ReactMarkdown>
            </div>
          )}

          {/* Audio player if present */}
          {note.audio_url && (
            <div className="mb-4">
              <audio src={note.audio_url} controls className="w-full h-10" />
            </div>
          )}

          {/* Image gallery if present */}
          {note.image_urls && note.image_urls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {note.image_urls.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-32 rounded-lg object-cover border border-border hover:opacity-90 transition-opacity cursor-zoom-in"
                  />
                </a>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
