import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Tag, Trash2 } from 'lucide-react';
import { CalendarEvent, CalendarEventInput, EventType } from '@/hooks/useCalendar';

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  selectedDate?: Date;
  onSave: (event: CalendarEventInput) => Promise<CalendarEvent | null>;
  onUpdate?: (id: string, updates: Partial<CalendarEventInput>) => Promise<CalendarEvent | null>;
  onDelete?: (id: string) => Promise<void>;
}

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'meeting', label: 'Reunião', color: 'bg-blue-500' },
  { value: 'focus', label: 'Foco', color: 'bg-purple-500' },
  { value: 'personal', label: 'Pessoal', color: 'bg-green-500' },
  { value: 'routine', label: 'Rotina', color: 'bg-orange-500' },
  { value: 'break', label: 'Pausa', color: 'bg-gray-500' },
];

export function EventModal({
  open,
  onOpenChange,
  event,
  selectedDate,
  onSave,
  onUpdate,
  onDelete,
}: EventModalProps) {
  const isEditing = !!event;
  
  // Initialize form with event data or defaults
  const getInitialDate = () => {
    if (event) return new Date(event.start_time).toISOString().split('T')[0];
    if (selectedDate) return selectedDate.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  const getInitialStartTime = () => {
    if (event) {
      const date = new Date(event.start_time);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return '09:00';
  };

  const getInitialEndTime = () => {
    if (event) {
      const date = new Date(event.end_time);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return '10:00';
  };

  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(getInitialDate());
  const [startTime, setStartTime] = useState(getInitialStartTime());
  const [endTime, setEndTime] = useState(getInitialEndTime());
  const [type, setType] = useState<EventType>(event?.type || 'meeting');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startDate = new Date(date);
      startDate.setHours(startHour, startMin, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(endHour, endMin, 0, 0);

      const eventData: CalendarEventInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startDate,
        end_time: endDate,
        type,
      };

      if (isEditing && event && onUpdate) {
        await onUpdate(event.id, eventData);
      } else {
        await onSave(eventData);
      }

      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (event && onDelete) {
      await onDelete(event.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {isEditing ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do evento"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do evento..."
              rows={2}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Início
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Fim
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tipo
            </label>
            <Select value={type} onValueChange={(v) => setType(v as EventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${t.color}`} />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          {isEditing && onDelete ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
              {isSaving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
