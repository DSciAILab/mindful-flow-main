import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WelcomeDialogProps {
  isOpen: boolean;
  userId: string;
  currentEmail: string;
  onComplete: (displayName: string) => void;
}

export function WelcomeDialog({
  isOpen,
  userId,
  currentEmail,
  onComplete,
}: WelcomeDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite como você gostaria de ser chamado",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('mf_profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Bem-vindo!",
        description: `Prazer em conhecê-lo, ${displayName.split(' ')[0]}!`,
      });

      onComplete(displayName.trim());
    } catch (error) {
      console.error('Error updating display name:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar seu nome. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Bem-vindo ao Mindful Flow!
          </DialogTitle>
          <DialogDescription className="text-center">
            Como você gostaria de ser chamado?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Seu nome</Label>
            <Input
              id="displayName"
              placeholder="Ex: Fernando"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              autoFocus
              className="text-center text-lg"
            />
            <p className="text-xs text-muted-foreground text-center">
              Você pode usar apenas seu primeiro nome ou nome completo
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || !displayName.trim()}
          size="lg"
          className="w-full"
        >
          {isSaving ? "Salvando..." : "Começar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
