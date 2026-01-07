import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sketch } from '@/types';

interface SketchCardProps {
  sketch: Sketch;
  onEdit: (sketch: Sketch) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function SketchCard({ sketch, onEdit, onDelete, className }: SketchCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg',
        className
      )}
    >
      {/* Thumbnail */}
      <div
        className="aspect-square cursor-pointer overflow-hidden bg-[#1a1a2e]"
        onClick={() => onEdit(sketch)}
      >
        {sketch.thumbnail ? (
          <img
            src={sketch.thumbnail}
            alt={sketch.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Pencil className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-foreground truncate">{sketch.title}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(sketch.created_at), "d 'de' MMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Actions overlay */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(sketch);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(sketch.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
