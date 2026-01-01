"use client";

import React, { useState, useRef } from "react";
import { ScheduledBlock } from "@/lib/supabase/scheduledBlocks";
import { format, parseISO, addMinutes, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface TimeBlockProps {
  block: ScheduledBlock;
  gridCellHeight: number;
  onUpdateBlock: (blockId: string, updates: Partial<ScheduledBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, block: ScheduledBlock) => void;
}

type TaskCategory = NonNullable<ScheduledBlock['tasks']>['category'];

const getCategoryColorClass = (category: TaskCategory | undefined) => {
  switch (category) {
    case 'red': return 'bg-red-500';
    case 'yellow': return 'bg-yellow-500';
    case 'purple': return 'bg-purple-500';
    case 'green': return 'bg-green-500';
    default: return 'bg-muted';
  }
};

const START_HOUR = 6;

const TimeBlock = ({ block, gridCellHeight, onUpdateBlock, onDeleteBlock, onDragStart }: TimeBlockProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStartTime, setEditStartTime] = useState<Date>(parseISO(block.start_time));
  const [editEndTime, setEditEndTime] = useState<Date>(parseISO(block.end_time));
  const [editDuration, setEditDuration] = useState(block.duration_minutes);

  const blockRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = blockRef.current?.offsetHeight || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaY = moveEvent.clientY - startYRef.current;
      const newHeight = Math.max(gridCellHeight, startHeightRef.current + deltaY);
      const newDurationMinutes = Math.round(newHeight / gridCellHeight) * 30;
      const newEndTime = addMinutes(parseISO(block.start_time), newDurationMinutes);

      if (blockRef.current) {
        blockRef.current.style.height = `${newHeight}px`;
      }
      setEditDuration(newDurationMinutes);
      setEditEndTime(newEndTime);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        onUpdateBlock(block.id, {
          end_time: editEndTime.toISOString(),
          duration_minutes: editDuration,
        });
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSaveEdit = () => {
    onUpdateBlock(block.id, {
      start_time: editStartTime.toISOString(),
      end_time: editEndTime.toISOString(),
      duration_minutes: differenceInMinutes(editEndTime, editStartTime),
    });
    setIsEditDialogOpen(false);
  };

  const handleUnschedule = () => {
    onDeleteBlock(block.id);
    setIsEditDialogOpen(false);
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    const newDate = new Date(type === 'start' ? editStartTime : editEndTime);
    newDate.setHours(hours, minutes, 0, 0);

    if (type === 'start') {
      let newEndTime = editEndTime;
      if (newDate >= newEndTime) {
        newEndTime = addMinutes(newDate, 30);
      }
      setEditStartTime(newDate);
      setEditEndTime(newEndTime);
      setEditDuration(differenceInMinutes(newEndTime, newDate));
    } else {
      let newStartTime = editStartTime;
      if (newDate <= newStartTime) {
        newStartTime = addMinutes(newDate, -30);
      }
      setEditStartTime(newStartTime);
      setEditEndTime(newDate);
      setEditDuration(differenceInMinutes(newDate, newStartTime));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const newStartTime = new Date(date);
    newStartTime.setHours(editStartTime.getHours(), editStartTime.getMinutes(), 0, 0);
    const newEndTime = addMinutes(newStartTime, editDuration);
    setEditStartTime(newStartTime);
    setEditEndTime(newEndTime);
  };

  const blockHeight = (block.duration_minutes / 30) * gridCellHeight;
  const minutesOffset = START_HOUR * 60;
  const blockTopPosition = ((parseISO(block.start_time).getHours() * 60 + parseISO(block.start_time).getMinutes()) - minutesOffset) / 30 * gridCellHeight;
  const categoryColorClass = getCategoryColorClass(block.tasks?.category);

  return (
    <>
      <div
        ref={blockRef}
        draggable
        onDragStart={(e) => onDragStart(e, block)}
        onClick={() => setIsEditDialogOpen(true)}
        className={cn(
          "absolute w-[calc(100%-4px)] left-[2px] rounded-md p-2 text-xs cursor-grab active:cursor-grabbing shadow-md",
          "flex flex-col justify-between overflow-hidden",
          "bg-primary text-primary-foreground",
          categoryColorClass
        )}
        style={{ top: `${blockTopPosition}px`, height: `${blockHeight}px` }}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold truncate">{block.tasks?.title || "Tarefa Agendada"}</span>
          <div className="flex items-center gap-1">
            {block.project && <Badge variant="secondary" className="bg-primary-foreground text-primary">@{block.project}</Badge>} {/* Usar block.project */}
            {block.tasks?.hashtags.map((tag, index) => <Badge key={index} variant="secondary" className="bg-primary-foreground text-primary">#{tag}</Badge>)}
          </div>
        </div>
        <div className="flex justify-between items-end mt-auto">
          <span className="text-xs opacity-80">
            {format(parseISO(block.start_time), 'HH:mm', { locale: ptBR })} - {format(parseISO(block.end_time), 'HH:mm', { locale: ptBR })}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground" onClick={(e) => { e.stopPropagation(); setIsEditDialogOpen(true); }}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground" onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize bg-primary-foreground/20 hover:bg-primary-foreground/40"
          onMouseDown={handleMouseDown}
        />
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Bloco Agendado</DialogTitle>
            <DialogDescription>Ajuste os detalhes e o horário do seu bloco de tempo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tarefa</Label>
              <Input value={block.tasks?.title || ""} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("col-span-3 justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(editStartTime, "PPP", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={editStartTime} onSelect={handleDateChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-start-time" className="text-right">Início</Label>
              <Input id="edit-start-time" type="time" value={format(editStartTime, 'HH:mm')} onChange={(e) => handleTimeChange('start', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-end-time" className="text-right">Fim</Label>
              <Input id="edit-end-time" type="time" value={format(editEndTime, 'HH:mm')} onChange={(e) => handleTimeChange('end', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Duração</Label>
              <Input value={`${editDuration} minutos`} readOnly className="col-span-3" />
            </div>
          </div>
          <DialogFooter className="justify-between">
            <Button variant="destructive" onClick={handleUnschedule}>Remover do Agendamento</Button>
            <div className="flex gap-2">
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimeBlock;