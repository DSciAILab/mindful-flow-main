"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, addMinutes, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabaseDb } from "@/lib/supabase";
import { useSession } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import TimeBlock from "./TimeBlock";
import { ScheduledBlock } from "@/lib/supabase/scheduledBlocks";
import { ParsedTask } from "@/utils/taskParser";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface TimeGridProps {
  onScheduledBlockAdded: (task: ParsedTask) => void;
  onScheduledBlockDeleted: () => void;
}

const GRID_CELL_HEIGHT = 30; // pixels per 30 minutes
const MIN_BLOCK_DURATION = 30; // minutes
const START_HOUR = 6;
const END_HOUR = 20;

const TimeGrid = ({ onScheduledBlockAdded, onScheduledBlockDeleted }: TimeGridProps) => {
  const { user } = useSession();
  const userId = user?.id;
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<ScheduledBlock | null>(null);

  const loadScheduledBlocks = useCallback(async () => {
    if (userId) {
      const blocks = await supabaseDb.getScheduledBlocks(userId, currentDate);
      setScheduledBlocks(blocks);
    }
  }, [userId, currentDate]);

  useEffect(() => {
    loadScheduledBlocks();
  }, [loadScheduledBlocks]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data || !userId) return;

    const dropTargetRect = e.currentTarget.getBoundingClientRect();
    const yOffset = e.clientY - dropTargetRect.top;
    const minutesFromGridStart = Math.round(yOffset / GRID_CELL_HEIGHT) * MIN_BLOCK_DURATION;
    const totalMinutesFromMidnight = (START_HOUR * 60) + minutesFromGridStart;

    const startTime = addMinutes(startOfDay(currentDate), totalMinutesFromMidnight);

    if (isDraggingBlock && draggedBlock) {
      // Moving an existing block
      const newEndTime = addMinutes(startTime, draggedBlock.duration_minutes);
      const success = await supabaseDb.updateScheduledBlock(userId, draggedBlock.id, {
        start_time: startTime.toISOString(),
        end_time: newEndTime.toISOString(),
        duration_minutes: draggedBlock.duration_minutes, // Certifica que a duração é passada
      });
      if (success) {
        toast.success("Bloco agendado movido!");
        loadScheduledBlocks();
      } else {
        toast.error("Falha ao mover bloco agendado.");
      }
      setIsDraggingBlock(false);
      setDraggedBlock(null);
    } else {
      // Adding a new task from the left panel
      const { task }: { task: ParsedTask } = JSON.parse(data);
      const endTime = addMinutes(startTime, MIN_BLOCK_DURATION);
      const newBlock = {
        task_id: task.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: MIN_BLOCK_DURATION,
      };

      const addedBlock = await supabaseDb.addScheduledBlock(userId, newBlock);
      if (addedBlock) {
        toast.success(`Tarefa "${task.title}" agendada!`);
        loadScheduledBlocks();
        onScheduledBlockAdded(task);
      } else {
        toast.error("Falha ao agendar tarefa.");
      }
    }
  };

  const handleUpdateBlock = async (blockId: string, updates: Partial<ScheduledBlock>) => {
    if (!userId) return;
    // A função updateScheduledBlock espera ScheduledBlockInput, que não inclui 'tasks' ou 'project'
    // Filtramos as propriedades para garantir que apenas as colunas da tabela sejam enviadas
    const updatesToSend = {
      start_time: updates.start_time,
      end_time: updates.end_time,
      duration_minutes: updates.duration_minutes,
      task_id: updates.task_id, // Incluir task_id se for atualizável
    };
    const success = await supabaseDb.updateScheduledBlock(userId, blockId, updatesToSend);
    if (success) {
      toast.success("Bloco agendado atualizado!");
      loadScheduledBlocks();
    } else {
      toast.error("Falha ao atualizar bloco agendado.");
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!userId) return;
    const success = await supabaseDb.deleteScheduledBlock(userId, blockId);
    if (success) {
      toast.success("Bloco agendado deletado!");
      loadScheduledBlocks();
      onScheduledBlockDeleted();
    } else {
      toast.error("Falha ao deletar bloco agendado.");
    }
  };

  const handleBlockDragStart = (e: React.DragEvent<HTMLDivElement>, block: ScheduledBlock) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ blockId: block.id }));
    e.dataTransfer.effectAllowed = "move";
    setIsDraggingBlock(true);
    setDraggedBlock(block);
  };

  const handlePreviousDay = () => setCurrentDate(prev => addMinutes(prev, -24 * 60));
  const handleNextDay = () => setCurrentDate(prev => addMinutes(prev, 24 * 60));
  const handleGoToToday = () => setCurrentDate(new Date());

  const isTodaySelected = isSameDay(currentDate, new Date());

  const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) * (60 / MIN_BLOCK_DURATION) }, (_, i) => {
    const hour = START_HOUR + Math.floor(i * MIN_BLOCK_DURATION / 60);
    const minute = (i * MIN_BLOCK_DURATION) % 60;
    return format(new Date().setHours(hour, minute, 0, 0), 'HH:mm');
  });

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-2 border-b">
        <Button variant="ghost" size="icon" onClick={handlePreviousDay}><ChevronLeft className="h-4 w-4" /></Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(currentDate, "PPP", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && setCurrentDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" onClick={handleNextDay}><ChevronRight className="h-4 w-4" /></Button>
        {!isTodaySelected && (
          <Button variant="outline" size="sm" onClick={handleGoToToday} className="ml-2">Hoje</Button>
        )}
      </div>
      <div
        className="relative flex-grow overflow-y-auto border-l border-border pl-14"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {timeSlots.map((time, index) => (
          <div
            key={time}
            className={cn(
              "relative border-b border-dashed border-border/50",
              index % 2 === 0 ? "bg-background" : "bg-muted/20"
            )}
            style={{ height: `${GRID_CELL_HEIGHT}px` }}
          >
            {index % 2 === 0 && (
              <span className="absolute -left-14 top-[-8px] text-xs text-muted-foreground pr-2 w-12 text-right">
                {time}
              </span>
            )}
          </div>
        ))}
        {scheduledBlocks.map((block) => (
          <TimeBlock
            key={block.id}
            block={block}
            gridCellHeight={GRID_CELL_HEIGHT}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onDragStart={handleBlockDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default TimeGrid;