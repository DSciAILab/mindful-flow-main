import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  CheckSquare, 
  Inbox, 
  Trash2, 
  Check, 
  Clock,
  Lightbulb
} from 'lucide-react';
import type { Distraction } from '@/types/distractions';

interface DistractionsListProps {
  distractions: Distraction[];
  onConvertToTask: (distraction: Distraction) => void;
  onMoveToInbox: (distraction: Distraction) => void;
  onDelete: (id: string) => void;
  onMarkProcessed: (id: string) => void;
}

export function DistractionsList({
  distractions,
  onConvertToTask,
  onMoveToInbox,
  onDelete,
  onMarkProcessed,
}: DistractionsListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('pending');

  const filteredDistractions = distractions.filter(d => {
    if (filter === 'pending') return !d.processed;
    if (filter === 'processed') return d.processed;
    return true;
  });

  const pendingCount = distractions.filter(d => !d.processed).length;
  const processedCount = distractions.filter(d => d.processed).length;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  if (distractions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhuma distração capturada ainda.
            <br />
            <span className="text-sm">
              Use o botão 💡 durante suas sessões de foco.
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Parking Lot
          </CardTitle>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending">
              Pendentes ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Processadas ({processedCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              Todas ({distractions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-0">
            <div className="space-y-2">
              {filteredDistractions.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Nenhuma distração nesta categoria.
                </p>
              ) : (
                filteredDistractions.map((distraction) => (
                  <div
                    key={distraction.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                      distraction.processed
                        ? "bg-muted/30 border-muted"
                        : "bg-card border-border hover:border-amber-500/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        distraction.processed && "text-muted-foreground line-through"
                      )}>
                        {distraction.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(distraction.createdAt)}
                        </span>
                        {distraction.convertedToTaskId && (
                          <Badge variant="outline" className="text-xs">
                            Convertida em tarefa
                          </Badge>
                        )}
                      </div>
                    </div>

                    {!distraction.processed && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onConvertToTask(distraction)}
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          title="Converter em tarefa"
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onMoveToInbox(distraction)}
                          className="h-8 w-8 text-blue-500 hover:bg-blue-500/10"
                          title="Mover para inbox"
                        >
                          <Inbox className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onMarkProcessed(distraction.id)}
                          className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                          title="Marcar como processado"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(distraction.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
