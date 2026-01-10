import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, 
  CheckSquare, 
  Inbox, 
  Trash2, 
  Check,
  Sparkles
} from 'lucide-react';
import type { Distraction, DistractionAction } from '@/types/distractions';

interface DistractionReviewModalProps {
  isOpen: boolean;
  distractions: Distraction[];
  onClose: () => void;
  onProcessAll: (actions: Map<string, DistractionAction>) => void;
}

export function DistractionReviewModal({
  isOpen,
  distractions,
  onClose,
  onProcessAll,
}: DistractionReviewModalProps) {
  const [actions, setActions] = useState<Map<string, DistractionAction>>(new Map());

  // Filter to only unprocessed distractions
  const unprocessedDistractions = useMemo(
    () => distractions.filter(d => !d.processed),
    [distractions]
  );

  const setAction = (id: string, action: DistractionAction) => {
    setActions(prev => {
      const next = new Map(prev);
      if (next.get(id) === action) {
        next.delete(id);
      } else {
        next.set(id, action);
      }
      return next;
    });
  };

  const handleProcessAll = () => {
    // Set remaining items to 'processed' if no action selected
    const finalActions = new Map(actions);
    unprocessedDistractions.forEach(d => {
      if (!finalActions.has(d.id)) {
        finalActions.set(d.id, 'processed');
      }
    });
    onProcessAll(finalActions);
    setActions(new Map());
    onClose();
  };

  const handleClose = () => {
    setActions(new Map());
    onClose();
  };

  const getActionButton = (
    distraction: Distraction,
    action: DistractionAction,
    icon: React.ReactNode,
    label: string,
    color: string
  ) => {
    const isSelected = actions.get(distraction.id) === action;
    return (
      <Button
        size="sm"
        variant={isSelected ? 'default' : 'outline'}
        onClick={() => setAction(distraction.id, action)}
        className={cn(
          "gap-1 h-8 text-xs",
          isSelected && color
        )}
      >
        {icon}
        {label}
      </Button>
    );
  };

  if (unprocessedDistractions.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Lightbulb className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span>Revisar Pensamentos</span>
              <DialogDescription className="text-left mt-1">
                Você capturou {unprocessedDistractions.length} pensamento
                {unprocessedDistractions.length !== 1 ? 's' : ''} durante o foco!
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {unprocessedDistractions.map((distraction) => (
            <div
              key={distraction.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                actions.has(distraction.id)
                  ? "bg-muted/50 border-muted"
                  : "bg-card border-border"
              )}
            >
              <p className={cn(
                "text-sm mb-3",
                actions.has(distraction.id) && "text-muted-foreground"
              )}>
                {distraction.content}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {getActionButton(
                  distraction,
                  'task',
                  <CheckSquare className="h-3 w-3" />,
                  'Tarefa',
                  'bg-primary'
                )}
                {getActionButton(
                  distraction,
                  'inbox',
                  <Inbox className="h-3 w-3" />,
                  'Inbox',
                  'bg-blue-500'
                )}
                {getActionButton(
                  distraction,
                  'delete',
                  <Trash2 className="h-3 w-3" />,
                  'Descartar',
                  'bg-destructive'
                )}
              </div>
              
              {actions.has(distraction.id) && (
                <Badge 
                  variant="outline" 
                  className="mt-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {actions.get(distraction.id) === 'task' && 'Será convertido em tarefa'}
                  {actions.get(distraction.id) === 'inbox' && 'Será movido para inbox'}
                  {actions.get(distraction.id) === 'delete' && 'Será descartado'}
                </Badge>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Revisar Depois
          </Button>
          <Button onClick={handleProcessAll} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Processar Tudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
