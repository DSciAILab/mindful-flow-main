import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Trophy, 
  Pause, 
  XCircle, 
  CheckCircle2,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit, HabitArchiveStatus } from "@/types";

interface ArchiveHabitModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onArchive: (habitId: string, status: HabitArchiveStatus, reason?: string) => Promise<boolean>;
}

const archiveOptions: { 
  value: HabitArchiveStatus; 
  label: string; 
  description: string;
  icon: typeof Trophy;
  color: string;
}[] = [
  { 
    value: 'completed', 
    label: 'Objetivo Alcançado! 🎉', 
    description: 'O hábito cumpriu seu propósito',
    icon: Trophy,
    color: 'text-yellow-500'
  },
  { 
    value: 'paused', 
    label: 'Pausar Temporariamente', 
    description: 'Posso retomar quando quiser',
    icon: Pause,
    color: 'text-blue-500'
  },
  { 
    value: 'cancelled', 
    label: 'Encerrar Hábito', 
    description: 'Não é mais relevante para mim',
    icon: XCircle,
    color: 'text-muted-foreground'
  },
];

export function ArchiveHabitModal({ 
  habit, 
  isOpen, 
  onClose, 
  onArchive 
}: ArchiveHabitModalProps) {
  const [status, setStatus] = useState<HabitArchiveStatus>('completed');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!habit) return;
    
    setIsSubmitting(true);
    const success = await onArchive(habit.id, status, reason || undefined);
    setIsSubmitting(false);
    
    if (success) {
      setStatus('completed');
      setReason('');
      onClose();
    }
  };

  const handleClose = () => {
    setStatus('completed');
    setReason('');
    onClose();
  };

  if (!habit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Arquivar Hábito
          </DialogTitle>
          <DialogDescription>
            O histórico de "{habit.title}" será preservado para insights futuros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Archive Status Selection */}
          <RadioGroup 
            value={status} 
            onValueChange={(v) => setStatus(v as HabitArchiveStatus)}
            className="space-y-3"
          >
            {archiveOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <RadioGroupItem value={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", option.color)} />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {/* Reason (optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm">
              Motivo ou Conquista (opcional)
            </Label>
            <Textarea
              id="reason"
              placeholder={
                status === 'completed' 
                  ? "Ex: Perdi os 5kg que queria! 🎉" 
                  : status === 'paused'
                  ? "Ex: Férias, vou retomar em Janeiro"
                  : "Ex: Mudei de prioridade"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className={cn(
              status === 'completed' && "bg-yellow-500 hover:bg-yellow-600"
            )}
          >
            {isSubmitting ? (
              "Arquivando..."
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {status === 'completed' ? 'Celebrar & Arquivar' : 'Arquivar'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
