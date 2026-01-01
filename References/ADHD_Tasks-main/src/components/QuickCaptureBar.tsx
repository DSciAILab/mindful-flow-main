"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Mic, Square } from "lucide-react";
import { ParsedTask, parseTaskInput } from "@/utils/taskParser"; // Adicionado parseTaskInput
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useNavigation } from "@/contexts/NavigationContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuickCaptureBarProps {
  onCapture: (task: ParsedTask) => void;
}

const QuickCaptureBar = ({ onCapture }: QuickCaptureBarProps) => {
  const [taskInput, setTaskInput] = useState("");
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceRecorder();
  const { isFooterNavVisible } = useNavigation(); // Usar isFooterNavVisible do contexto
  const isMobile = useIsMobile();

  const handleAddTask = () => {
    if (taskInput.trim()) {
      const parsedTask = parseTaskInput(taskInput);
      onCapture(parsedTask);
      setTaskInput("");
    }
  };

  const handleVoiceCapture = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording((transcript) => {
        setTaskInput(prev => `${prev} ${transcript}`.trim());
      });
    }
  };

  // Renderiza apenas se for mobile e o footer nav estiver visível
  if (!isMobile || !isFooterNavVisible) {
    return null;
  }

  return (
    <div className="p-4 bg-background border-t border-border flex flex-col items-center gap-2">
      <div className="flex w-full gap-2">
        <Input
          placeholder={isTranscribing ? "A transcrever..." : "Capturar: - tarefa @projeto #tag /3 /R"}
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
          className="flex-grow"
          disabled={isTranscribing}
        />
        <Button size="icon" onClick={handleVoiceCapture} disabled={isTranscribing} variant={isRecording ? "destructive" : "outline"}>
          {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          <span className="sr-only">{isRecording ? "Parar Gravação" : "Iniciar Gravação"}</span>
        </Button>
        <Button size="icon" onClick={handleAddTask} disabled={isRecording || isTranscribing}>
          <Plus className="h-5 w-5" />
          <span className="sr-only">Adicionar Item</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Comece com <span className="font-semibold">: </span> para notas. Use <span className="font-semibold">/1-3</span> p/ prioridade e <span className="font-semibold">/R,Y,P,G</span> p/ categoria.
      </p>
    </div>
  );
};

export default QuickCaptureBar;