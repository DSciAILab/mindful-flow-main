import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import {
  isAuthenticated as isGoogleAuthenticated,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  toGoogleEvent,
} from '@/lib/google-calendar';

export type EventType = 'focus' | 'meeting' | 'break' | 'personal' | 'routine';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  type: EventType;
  related_task_id?: string | null;
  related_project_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  type: EventType;
  related_task_id?: string;
  related_project_id?: string;
}

// Helper to check if auto-sync is enabled
const isAutoSyncEnabled = () => {
  return localStorage.getItem('mf_google_auto_sync') === 'true';
};

// Sync mapping functions
const getSyncMapping = async (localEventId: string) => {
  const { data } = await supabase
    .from('mf_google_calendar_sync')
    .select('google_event_id')
    .eq('local_event_id', localEventId)
    .single();
  return data?.google_event_id;
};

const createSyncMapping = async (localEventId: string, googleEventId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('mf_google_calendar_sync').insert({
    user_id: user.id,
    local_event_id: localEventId,
    google_event_id: googleEventId,
    google_calendar_id: 'primary',
    sync_status: 'synced',
  });
};

const deleteSyncMapping = async (localEventId: string) => {
  await supabase
    .from('mf_google_calendar_sync')
    .delete()
    .eq('local_event_id', localEventId);
};

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mf_calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Erro ao carregar agenda',
        description: 'Não foi possível carregar seus eventos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (event: CalendarEventInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('mf_calendar_events')
        .insert([{ 
          ...event, 
          user_id: user.id,
          start_time: event.start_time.toISOString(),
          end_time: event.end_time.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setEvents([...events, data].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ));
      
      toast({
        title: 'Evento criado',
        description: 'Agendado com sucesso.',
      });

      // Auto-sync to Google Calendar if enabled
      if (isAutoSyncEnabled() && isGoogleAuthenticated()) {
        try {
          const googleEvent = toGoogleEvent(data);
          const result = await createGoogleEvent(googleEvent);
          if (result.success && result.googleEventId) {
            await createSyncMapping(data.id, result.googleEventId);
          }
        } catch (syncError) {
          console.error('Google Calendar sync error:', syncError);
        }
      }

      return data;
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: 'Erro ao criar evento',
        description: 'Ocorreu um erro ao agendar o evento.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEventInput>) => {
    try {
      const dbUpdates: any = { ...updates };
      if (updates.start_time) dbUpdates.start_time = updates.start_time.toISOString();
      if (updates.end_time) dbUpdates.end_time = updates.end_time.toISOString();

      const { data, error } = await supabase
        .from('mf_calendar_events')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEvents(events.map(e => e.id === id ? data : e).sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ));

      // Auto-sync to Google Calendar if enabled
      if (isAutoSyncEnabled() && isGoogleAuthenticated()) {
        try {
          const googleEventId = await getSyncMapping(id);
          if (googleEventId) {
            const googleEvent = toGoogleEvent(data);
            await updateGoogleEvent(googleEventId, googleEvent);
          }
        } catch (syncError) {
          console.error('Google Calendar sync error:', syncError);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o evento.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      // Auto-sync to Google Calendar if enabled (do before local delete)
      if (isAutoSyncEnabled() && isGoogleAuthenticated()) {
        try {
          const googleEventId = await getSyncMapping(id);
          if (googleEventId) {
            await deleteGoogleEvent(googleEventId);
            await deleteSyncMapping(id);
          }
        } catch (syncError) {
          console.error('Google Calendar sync error:', syncError);
        }
      }

      const { error } = await supabase
        .from('mf_calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(events.filter(e => e.id !== id));
      toast({
        title: 'Evento removido',
        description: 'Removido da sua agenda.',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o evento.',
        variant: 'destructive',
      });
    }
  };

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents
  };
}

