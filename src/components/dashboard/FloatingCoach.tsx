import { useState, useRef, useEffect } from 'react';
import { useAICoach } from '@/hooks/useAICoach';
import { useTasks } from '@/hooks/useTasks';
import { useUserStats } from '@/hooks/useUserStats';
import { useAIContext } from '@/hooks/useAIContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  Trash2,
  Minimize2,
  Maximize2 
} from 'lucide-react';

export function FloatingCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, isLoading, sendMessage, clearMessages } = useAICoach();
  const { tasks, addTask } = useTasks();
  const { stats } = useUserStats();
  const { getContextForAI, addInsight } = useAIContext();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');

    // Get unified context from all sources (tasks, habits, wheel of life)
    const unifiedContext = getContextForAI();
    
    // Build context for AI Coach
    const context = {
      tasksCount: unifiedContext.tasksStats.total,
      pendingTasksCount: unifiedContext.tasksStats.pending,
      completedTasksCount: unifiedContext.tasksStats.completed,
      urgentTasksCount: unifiedContext.tasksStats.urgent,
      completedToday: stats.tasksCompletedToday,
      focusMinutesToday: stats.focusMinutesToday,
      // Pass actual tasks to AI
      tasksList: unifiedContext.pendingTasks,
      urgentTasksTitles: unifiedContext.urgentTasksTitles,
      // New: Wheel of Life data
      wheelOfLifeScores: unifiedContext.wheelOfLifeScores,
      lowestAreas: unifiedContext.lowestAreas,
      // New: Habits data
      habitsStats: unifiedContext.habitsStats,
      // New: Recent insights from other AI modules
      recentInsights: unifiedContext.recentInsights,
    };

    await sendMessage(userText, context, async (taskData) => {
      const newTask = await addTask({
        title: taskData.title,
        priority: taskData.priority as any,
        status: 'next',
        tags: [],
      });

      if (newTask) {
        toast({
          title: "Tarefa criada! ✅",
          description: `"${taskData.title}" foi adicionada à sua lista.`,
        });
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-purple-500 text-white shadow-lg shadow-primary/30 transition-transform hover:scale-110 md:bottom-8 md:right-8"
      >
        <Bot className="h-7 w-7" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
        </span>
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300",
        isMinimized 
          ? "bottom-4 right-4 h-14 w-64 md:bottom-8 md:right-8" 
          : "bottom-4 right-4 h-[500px] w-[95vw] md:bottom-8 md:right-8 md:h-[600px] md:w-[400px]"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-primary to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-yellow-300" />
          </div>
          {!isMinimized && (
            <div>
              <h3 className="text-sm font-bold">Coach IA</h3>
              <p className="text-[10px] text-white/80">Seu assistente de foco</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <button
              onClick={clearMessages}
              className="rounded-full p-2 transition-colors hover:bg-white/20"
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded-full p-2 transition-colors hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-muted/30 p-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    msg.role === 'user'
                      ? "rounded-br-none bg-primary text-primary-foreground"
                      : "rounded-bl-none border border-border bg-background text-foreground"
                  )}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0.5 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>h4]:text-xs [&>strong]:text-foreground [&>p]:leading-relaxed">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-none border border-border bg-background px-4 py-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 rounded-xl border-none bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 px-1 text-[10px] text-muted-foreground">
              Dica: Diga "crie uma tarefa para..." para adicionar tarefas rapidamente
            </p>
          </div>
        </>
      )}
    </div>
  );
}

