import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { 
  RefreshCw, 
  Save, 
  TrendingUp, 
  History, 
  Heart, 
  Briefcase, 
  Wallet, 
  Users, 
  Home, 
  PartyPopper, 
  Sprout, 
  Gamepad2,
  X,
  Check,
  MessageCircle,
  Send,
  Loader2,
  Sparkles
} from "lucide-react";

interface LifeArea {
  id: string;
  name: string;
  icon: React.ElementType;
  score: number;
  color: string;
}

interface ScoreChange {
  id: string;
  areaId: string;
  areaName: string;
  previousScore: number;
  newScore: number;
  reason: string;
  aiAnalysis?: string;
  date: Date;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const defaultAreas: LifeArea[] = [
  { id: 'health', name: 'Saúde', icon: Heart, score: 7, color: 'hsl(160, 60%, 45%)' },
  { id: 'career', name: 'Carreira', icon: Briefcase, score: 6, color: 'hsl(32, 85%, 55%)' },
  { id: 'finances', name: 'Finanças', icon: Wallet, score: 5, color: 'hsl(45, 90%, 55%)' },
  { id: 'relationships', name: 'Relacionamentos', icon: Users, score: 8, color: 'hsl(0, 72%, 55%)' },
  { id: 'family', name: 'Família', icon: Home, score: 7, color: 'hsl(280, 60%, 55%)' },
  { id: 'social', name: 'Social', icon: PartyPopper, score: 6, color: 'hsl(200, 70%, 50%)' },
  { id: 'personal', name: 'Crescimento', icon: Sprout, score: 5, color: 'hsl(120, 50%, 45%)' },
  { id: 'fun', name: 'Diversão', icon: Gamepad2, score: 4, color: 'hsl(320, 70%, 55%)' },
];

interface WheelOfLifeProps {
  onSave?: (areas: LifeArea[], changelog: ScoreChange[]) => void;
}

export function WheelOfLife({ onSave }: WheelOfLifeProps) {
  const [areas, setAreas] = useState<LifeArea[]>(defaultAreas);
  const [changelog, setChangelog] = useState<ScoreChange[]>([]);
  const [showChangelog, setShowChangelog] = useState(false);
  
  // Dragging state
  const [draggingArea, setDraggingArea] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{
    areaId: string;
    previousScore: number;
    newScore: number;
  } | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatArea, setChatArea] = useState<LifeArea | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  const { greetingName } = useProfile();

  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;

  const getPointOnCircle = (index: number, score: number) => {
    const angle = (index * 360 / areas.length - 90) * (Math.PI / 180);
    const radius = (score / 10) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const getScoreFromPosition = (clientX: number, clientY: number, areaIndex: number): number => {
    if (!svgRef.current) return 5;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const score = Math.round((distance / maxRadius) * 10);
    return Math.max(1, Math.min(10, score));
  };

  const handleMouseDown = (areaId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingArea(areaId);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingArea) return;
    
    const areaIndex = areas.findIndex(a => a.id === draggingArea);
    if (areaIndex === -1) return;
    
    const newScore = getScoreFromPosition(e.clientX, e.clientY, areaIndex);
    
    setAreas(prev => prev.map(a => 
      a.id === draggingArea ? { ...a, score: newScore } : a
    ));
  }, [draggingArea, areas]);

  const handleMouseUp = useCallback(() => {
    if (!draggingArea) return;
    
    const area = areas.find(a => a.id === draggingArea);
    const originalArea = defaultAreas.find(a => a.id === draggingArea);
    
    if (area && originalArea) {
      const previousScore = changelog.length > 0 
        ? changelog.filter(c => c.areaId === draggingArea).at(-1)?.newScore ?? originalArea.score
        : originalArea.score;
      
      if (area.score !== previousScore) {
        setPendingChange({
          areaId: draggingArea,
          previousScore,
          newScore: area.score,
        });
      }
    }
    
    setDraggingArea(null);
  }, [draggingArea, areas, changelog]);

  const handleConfirmChange = async () => {
    if (!pendingChange || !changeReason.trim()) return;
    
    const area = areas.find(a => a.id === pendingChange.areaId);
    if (!area) return;
    
    setIsAnalyzing(true);
    
    let aiAnalysis = "";
    try {
      const { data, error } = await supabase.functions.invoke('wheel-of-life-ai', {
        body: {
          action: 'analyze_change',
          data: {
            areaName: area.name,
            previousScore: pendingChange.previousScore,
            newScore: pendingChange.newScore,
            reason: changeReason.trim(),
          }
        }
      });
      
      if (!error && data?.message) {
        aiAnalysis = data.message;
      }
    } catch (e) {
      console.error('Error getting AI analysis:', e);
    }
    
    const newChange: ScoreChange = {
      id: Date.now().toString(),
      areaId: pendingChange.areaId,
      areaName: area.name,
      previousScore: pendingChange.previousScore,
      newScore: pendingChange.newScore,
      reason: changeReason.trim(),
      aiAnalysis,
      date: new Date(),
    };
    
    setChangelog(prev => [newChange, ...prev]);
    setPendingChange(null);
    setChangeReason("");
    setIsAnalyzing(false);
  };

  const handleCancelChange = () => {
    if (!pendingChange) return;
    
    const previousScore = pendingChange.previousScore;
    setAreas(prev => prev.map(a => 
      a.id === pendingChange.areaId ? { ...a, score: previousScore } : a
    ));
    
    setPendingChange(null);
    setChangeReason("");
  };

  const startChat = (area: LifeArea) => {
    setChatArea(area);
    const greeting = greetingName ? `Olá, ${greetingName}!` : 'Olá!';
    setChatMessages([{
      role: 'assistant',
      content: `${greeting} Vou te ajudar a refletir sobre sua área de ${area.name}. Seu score atual é ${area.score}/10. Como você se sente em relação a isso?`
    }]);
    setShowChat(true);
    setShowChangelog(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatArea || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('wheel-of-life-ai', {
        body: {
          action: 'help_define_score',
          data: {
            areaName: chatArea.name,
            currentScore: chatArea.score,
            userMessage,
            conversationHistory: chatMessages,
          }
        }
      });
      
      if (error) throw error;
      
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message || "Desculpe, não consegui processar."
      }]);
    } catch (e) {
      console.error('Chat error:', e);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Desculpe, tive um problema. Tente novamente."
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReset = () => {
    setAreas(defaultAreas);
    setChangelog([]);
  };

  const polygonPoints = areas
    .map((area, i) => {
      const point = getPointOnCircle(i, area.score);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const averageScore = (areas.reduce((sum, a) => sum + a.score, 0) / areas.length).toFixed(1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Roda da Vida
          </h3>
          <p className="text-sm text-muted-foreground">Arraste os pontos para ajustar sua avaliação</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={showChangelog ? "default" : "ghost"} 
            size="sm" 
            onClick={() => { setShowChangelog(!showChangelog); setShowChat(false); }}
          >
            <History className="mr-1 h-4 w-4" />
            Histórico {changelog.length > 0 && `(${changelog.length})`}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="default" size="sm" onClick={() => onSave?.(areas, changelog)}>
            <Save className="mr-1 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Pending change confirmation modal */}
      {pendingChange && (
        <div className="mb-4 animate-fade-in rounded-xl border border-primary/50 bg-primary/10 p-4">
          <p className="mb-2 text-sm font-medium text-foreground">
            Por que você mudou "{areas.find(a => a.id === pendingChange.areaId)?.name}" 
            de {pendingChange.previousScore} para {pendingChange.newScore}?
          </p>
          <Textarea
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Explique brevemente o motivo desta mudança..."
            className="mb-3 min-h-[80px] resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancelChange}>
              <X className="mr-1 h-4 w-4" />
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleConfirmChange}
              disabled={!changeReason.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1 h-4 w-4" />
              )}
              {isAnalyzing ? "Analisando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wheel visualization */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg 
              ref={svgRef}
              width="300" 
              height="300" 
              className="cursor-pointer drop-shadow-lg"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Background circles */}
              {[2, 4, 6, 8, 10].map((level) => (
                <circle
                  key={level}
                  cx={centerX}
                  cy={centerY}
                  r={(level / 10) * maxRadius}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  strokeDasharray={level === 10 ? "none" : "4,4"}
                  opacity={0.5}
                />
              ))}

              {/* Level labels */}
              {[2, 4, 6, 8, 10].map((level) => (
                <text
                  key={`label-${level}`}
                  x={centerX + 5}
                  y={centerY - (level / 10) * maxRadius + 4}
                  className="fill-muted-foreground text-[10px]"
                >
                  {level}
                </text>
              ))}

              {/* Sector lines */}
              {areas.map((_, i) => {
                const point = getPointOnCircle(i, 10);
                return (
                  <line
                    key={i}
                    x1={centerX}
                    y1={centerY}
                    x2={point.x}
                    y2={point.y}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    opacity={0.3}
                  />
                );
              })}

              {/* Filled polygon */}
              <polygon
                points={polygonPoints}
                fill="hsl(var(--primary) / 0.2)"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                className="transition-all duration-100"
              />

              {/* Draggable score dots */}
              {areas.map((area, i) => {
                const point = getPointOnCircle(i, area.score);
                const isDragging = draggingArea === area.id;
                
                return (
                  <g key={area.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={20}
                      fill="transparent"
                      className="cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => handleMouseDown(area.id, e)}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isDragging ? 14 : 10}
                      fill={area.color}
                      stroke="hsl(var(--background))"
                      strokeWidth="3"
                      className={cn(
                        "pointer-events-none transition-all duration-100",
                        isDragging && "drop-shadow-lg"
                      )}
                    />
                    <text
                      x={point.x}
                      y={point.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none fill-white text-xs font-bold"
                    >
                      {area.score}
                    </text>
                  </g>
                );
              })}

              {/* Labels with icons */}
              {areas.map((area, i) => {
                const point = getPointOnCircle(i, 12);
                const Icon = area.icon;
                
                return (
                  <g key={`label-${area.id}`}>
                    <foreignObject
                      x={point.x - 12}
                      y={point.y - 12}
                      width={24}
                      height={24}
                    >
                      <div 
                        className="flex h-full w-full items-center justify-center"
                        style={{ color: area.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Center score */}
              <text
                x={centerX}
                y={centerY - 8}
                textAnchor="middle"
                className="fill-foreground text-2xl font-bold"
              >
                {averageScore}
              </text>
              <text
                x={centerX}
                y={centerY + 12}
                textAnchor="middle"
                className="fill-muted-foreground text-xs"
              >
                média
              </text>
            </svg>
          </div>
        </div>

        {/* Area list / Changelog / Chat */}
        <div>
          {showChat && chatArea ? (
            <div className="flex h-[350px] flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageCircle className="h-4 w-4 text-accent" />
                  Chat: {chatArea.name}
                </h4>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowChat(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl p-3 text-sm",
                        msg.role === 'user'
                          ? "ml-8 bg-primary/20 text-foreground"
                          : "mr-8 bg-muted/50 text-foreground"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="mr-8 flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="mt-3 flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  disabled={isChatLoading}
                />
                <Button size="icon" onClick={sendChatMessage} disabled={isChatLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : showChangelog ? (
            <div className="space-y-2">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <History className="h-4 w-4" />
                Histórico de Mudanças
              </h4>
              {changelog.length === 0 ? (
                <div className="rounded-xl bg-muted/30 p-6 text-center">
                  <History className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma mudança registrada ainda
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {changelog.map((change) => {
                      const area = areas.find(a => a.id === change.areaId);
                      const Icon = area?.icon || TrendingUp;
                      const isPositive = change.newScore > change.previousScore;
                      
                      return (
                        <div
                          key={change.id}
                          className="rounded-xl border border-border/50 bg-muted/20 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" style={{ color: area?.color }} />
                              <span className="text-sm font-medium text-foreground">
                                {change.areaName}
                              </span>
                            </div>
                            <div className={cn(
                              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              isPositive 
                                ? "bg-status-completed/20 text-status-completed"
                                : "bg-priority-urgent/20 text-priority-urgent"
                            )}>
                              {change.previousScore} → {change.newScore}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{change.reason}</p>
                          {change.aiAnalysis && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg bg-accent/10 p-2">
                              <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                              <p className="text-xs text-accent">{change.aiAnalysis}</p>
                            </div>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            {formatDate(change.date)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="mb-3 text-sm font-medium text-foreground">Áreas da Vida</h4>
              <div className="grid gap-2">
                {areas.map((area) => {
                  const Icon = area.icon;
                  return (
                    <div
                      key={area.id}
                      className="flex items-center gap-3 rounded-xl bg-muted/30 p-2.5"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" style={{ color: area.color }} />
                      <span className="flex-1 text-sm font-medium text-foreground">
                        {area.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startChat(area)}
                        title="Conversar com IA"
                      >
                        <MessageCircle className="h-4 w-4 text-accent" />
                      </Button>
                      <span 
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: area.color }}
                      >
                        {area.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Insights</p>
            <p className="text-sm text-muted-foreground">
              {areas.filter(a => a.score <= 4).length > 0 
                ? `Áreas que precisam de atenção: ${areas.filter(a => a.score <= 4).map(a => a.name).join(', ')}`
                : 'Parabéns! Suas áreas estão bem equilibradas. Continue assim!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
