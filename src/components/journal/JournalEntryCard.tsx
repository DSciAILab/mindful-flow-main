import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2, 
  Trash2, 
  Heart,
  ThumbsUp,
  Smile,
  Meh,
  Frown,
  MoreVertical,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/types";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

const moodIcons: Record<number, { icon: typeof Heart; color: string }> = {
  5: { icon: Heart, color: 'text-green-500' },
  4: { icon: ThumbsUp, color: 'text-blue-500' },
  3: { icon: Smile, color: 'text-yellow-500' },
  2: { icon: Meh, color: 'text-orange-500' },
  1: { icon: Frown, color: 'text-red-500' },
};

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const MoodIcon = entry.mood ? moodIcons[entry.mood]?.icon : null;
  const moodColor = entry.mood ? moodIcons[entry.mood]?.color : '';

  const formatDate = (date: Date) => {
    const now = new Date();
    const entryDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoje às ${entryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Ontem às ${entryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return entryDate.toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return entryDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  const truncateContent = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const handleDelete = () => {
    onDelete(entry.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="group rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-2 flex items-center gap-2">
              {MoodIcon && (
                <MoodIcon className={cn("h-5 w-5 flex-shrink-0", moodColor)} />
              )}
              <h3 className="font-semibold text-foreground truncate">
                {entry.title || 'Sem título'}
              </h3>
            </div>

            {/* Content preview */}
            <p className="mb-3 text-sm text-muted-foreground line-clamp-3">
              {truncateContent(entry.content)}
            </p>

            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {entry.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {entry.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{entry.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(entry.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(entry)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A entrada será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
