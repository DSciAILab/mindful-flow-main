import { Button } from "@/components/ui/button";
import { 
  Inbox, 
  ChevronRight, 
  Type, 
  Mic, 
  Camera,
  Sparkles,
  Clock,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaptureItem } from "@/types";

interface InboxPreviewProps {
  items: CaptureItem[];
  onViewAll: () => void;
  onProcess: (item: CaptureItem) => void;
  onDelete?: (id: string) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  text: Type,
  audio: Mic,
  photo: Camera,
  video: Camera,
  canvas: Type,
};

export function InboxPreview({ items, onViewAll, onProcess, onDelete }: InboxPreviewProps) {
  const unprocessedCount = items.filter(i => !i.processed).length;

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
                <p className={cn(
                  "text-sm line-clamp-2",
                  item.processed ? "text-muted-foreground" : "text-foreground"
                )}>
                  {item.content}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
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
