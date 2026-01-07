import { SketchCard } from './SketchCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import type { Sketch } from '@/types';

interface SketchGalleryProps {
  sketches: Sketch[];
  loading: boolean;
  onNewSketch: () => void;
  onEditSketch: (sketch: Sketch) => void;
  onDeleteSketch: (id: string) => void;
}

export function SketchGallery({
  sketches,
  loading,
  onNewSketch,
  onEditSketch,
  onDeleteSketch,
}: SketchGalleryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sketches.length} {sketches.length === 1 ? 'desenho' : 'desenhos'}
        </p>
        <Button onClick={onNewSketch} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Desenho
        </Button>
      </div>

      {sketches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/30 py-16">
          <div className="rounded-full bg-primary/10 p-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 font-medium text-foreground">Nenhum desenho ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Novo Desenho" para começar
          </p>
          <Button onClick={onNewSketch} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Criar primeiro desenho
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sketches.map((sketch) => (
            <SketchCard
              key={sketch.id}
              sketch={sketch}
              onEdit={onEditSketch}
              onDelete={onDeleteSketch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
