import { Inbox, Sparkles, Pencil, Trash2, Save, X, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { QuickCapture } from "@/components/dashboard/QuickCapture";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CaptureItem } from "@/types";

interface InboxPageProps {
  inboxItems: CaptureItem[];
  handleCapture: (type: string, content: string, audioUrl?: string, projectId?: string) => Promise<void>;
  editingInboxId: string | null;
  editInboxContent: string;
  setEditInboxContent: (val: string) => void;
  handleSaveEditInbox: (id: string) => void;
  handleCancelEditInbox: () => void;
  setProcessingInboxItem: (item: CaptureItem) => void;
  handleStartEditInbox: (item: CaptureItem) => void;
  handleDeleteInboxItem: (id: string) => void;
}

export function InboxPage({
  inboxItems,
  handleCapture,
  editingInboxId,
  editInboxContent,
  setEditInboxContent,
  handleSaveEditInbox,
  handleCancelEditInbox,
  setProcessingInboxItem,
  handleStartEditInbox,
  handleDeleteInboxItem,
}: InboxPageProps) {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <Inbox className="h-8 w-8 text-primary" />
          Inbox
        </h1>
        <p className="text-muted-foreground">
          Capture tudo aqui, processe depois
        </p>
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <QuickCapture onCapture={handleCapture} />
      </div>
      <div className="animate-fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-card" style={{ animationDelay: '200ms' }}>
        <h3 className="mb-4 font-semibold text-foreground">Itens para processar</h3>
        {inboxItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Inbox vazio! 🎉</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {inboxItems.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl p-4 transition-all",
                  item.processed ? "bg-muted/30 opacity-60" : "bg-muted/50"
                )}
              >
                <div className="flex-1 min-w-0">
                  {editingInboxId === item.id ? (
                      <div className="space-y-2">
                        <Textarea 
                          value={editInboxContent}
                          onChange={(e) => setEditInboxContent(e.target.value)}
                          className="min-h-[100px] bg-background"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEditInbox(item.id)} className="h-7 px-2">
                            <Save className="mr-1 h-3 w-3" /> Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEditInbox} className="h-7 px-2">
                            <X className="mr-1 h-3 w-3" /> Cancelar
                          </Button>
                        </div>
                      </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          img: ({node, ...props}) => (
                            <img 
                              {...props} 
                              className="rounded-lg max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity my-2 border border-border" 
                              onClick={() => props.src && window.open(props.src, '_blank')} 
                            />
                          )
                        }}
                      >
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  
                  {item.audioUrl && (
                    <div className="mt-2">
                        <audio src={item.audioUrl} controls className="h-8 w-full max-w-[200px]" />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.createdAt.toLocaleDateString('pt-BR')} às {item.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!item.processed && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setProcessingInboxItem(item)}
                        title="Processar"
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                      {!editingInboxId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEditInbox(item)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteInboxItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
