"use client";

import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSession } from "@/integrations/supabase/auth";
import { supabaseDb } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Trash2, Brain, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Thought } from "@/lib/supabase/thoughts";

const Thoughts = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [newThought, setNewThought] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadThoughts = useCallback(async () => {
    if (user?.id) {
      setIsLoadingData(true);
      const data = await supabaseDb.getThoughts(user.id);
      setThoughts(data);
      setIsLoadingData(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadThoughts();
  }, [loadThoughts]);

  const handleAddThought = async () => {
    if (!user?.id || !newThought.trim()) return;

    setIsSubmitting(true);
    const result = await supabaseDb.addThought(user.id, newThought.trim());
    
    if (result) {
      setNewThought("");
      setThoughts([result, ...thoughts]);
      toast.success("Pensamento registrado.");
    } else {
      toast.error("Erro ao registrar pensamento.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteThought = async (id: string) => {
    if (!user?.id) return;
    const success = await supabaseDb.deleteThought(user.id, id);
    if (success) {
      setThoughts(thoughts.filter(t => t.id !== id));
      toast.success("Pensamento removido.");
    } else {
      toast.error("Erro ao remover.");
    }
  };

  if (isSessionLoading) return <Layout><div>Carregando...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Pensamentos
          </h1>
          <p className="text-muted-foreground">
            Seu espaço para brain dump, reflexões rápidas e ideias soltas.
          </p>
        </header>

        {/* Input Area */}
        <Card className="border-2 border-primary/10 shadow-sm">
          <CardContent className="pt-6">
            <Textarea 
              placeholder="O que está na sua mente agora?" 
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) handleAddThought();
              }}
            />
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Ctrl + Enter para enviar</span>
              <Button onClick={handleAddThought} disabled={isSubmitting || !newThought.trim()}>
                {isSubmitting ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Registrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-4">
          {isLoadingData ? (
            <>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </>
          ) : thoughts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum pensamento registrado ainda.</p>
            </div>
          ) : (
            thoughts.map((thought) => (
              <Card key={thought.id} className="group hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{thought.content}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteThought(thought.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground font-medium">
                    {format(new Date(thought.created_at), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Thoughts;