"use client";

import { useTimer } from '@/contexts/TimerContext';
import { Card, CardContent } from '@/components/ui/card';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom'; // Para navegação

interface GlobalTimerIndicatorProps {
  isFocusMode: boolean;
  currentPath: string;
}

const GlobalTimerIndicator = ({ isFocusMode, currentPath }: GlobalTimerIndicatorProps) => {
  const {
    isRunning, activeTask, timeLeft, isBreak, isBreakGracePeriod, breakGracePeriodTimeLeft, overtimeTaken,
    // NEW: Destructure new states
    isTaskGracePeriod, taskGracePeriodTimeLeft, taskOvertimeTaken,
  } = useTimer();
  const navigate = useNavigate(); // Hook para navegação

  // Define as páginas onde o indicador não deve aparecer
  const isHiddenPage = currentPath === '/' || currentPath === '/inbox';

  // Oculta se não estiver rodando, se não houver tarefa, se estiver em modo foco, ou na página principal/inbox
  if (!isRunning && !isBreakGracePeriod && overtimeTaken === 0 && !isTaskGracePeriod && taskOvertimeTaken === 0 || !activeTask && !isBreak && !isBreakGracePeriod && overtimeTaken === 0 && !isTaskGracePeriod && taskOvertimeTaken === 0 || isFocusMode || isHiddenPage) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const sign = seconds < 0 ? "-" : "";
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    return `${sign}${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isOvertime = overtimeTaken > 0; // Break overtime
  const isTaskOvertime = taskOvertimeTaken > 0; // NEW: Task overtime

  const displayTime = isTaskOvertime
    ? formatTime(taskOvertimeTaken)
    : isTaskGracePeriod
      ? formatTime(taskGracePeriodTimeLeft)
      : isOvertime
        ? formatTime(overtimeTaken)
        : isBreakGracePeriod
          ? formatTime(breakGracePeriodTimeLeft)
          : formatTime(timeLeft);

  const cardTitle = isTaskOvertime
    ? "Tarefa (Extra!)"
    : isTaskGracePeriod
      ? "Tarefa (Retorne!)"
      : isOvertime
        ? "Pausa (Extra!)"
        : isBreakGracePeriod
          ? "Pausa (Retorne!)"
          : isBreak
            ? "Pausa"
            : activeTask?.title;

  // Função para lidar com o clique no pop-up
  const handleClick = () => {
    navigate('/'); // Navegar para a página inicial
  };

  return (
    <div 
      className="fixed bottom-20 right-4 z-40 cursor-pointer" 
      onClick={handleClick} // Adiciona o evento de clique
    >
      <Card className={cn(
        "bg-primary text-primary-foreground shadow-lg",
        (isBreak || isBreakGracePeriod) && "bg-green-600",
        isOvertime && "bg-red-600", // Fundo vermelho para tempo extra de pausa
        isTaskGracePeriod && "bg-yellow-500 text-yellow-foreground", // NEW: Fundo amarelo para carência da tarefa
        isTaskOvertime && "bg-red-600" // NEW: Fundo vermelho para tempo extra da tarefa
      )}>
        <CardContent className="p-3 flex items-center gap-3">
          <Timer className="h-5 w-5" />
          <div className="flex flex-col text-sm">
            <span className="font-semibold truncate max-w-[150px]">
              {cardTitle}
            </span>
            <span className="font-mono text-lg">{displayTime}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalTimerIndicator;