import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  loadGoogleApis,
  isAuthenticated,
  signIn,
  signOut,
  getGoogleCalendarEvents,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  toGoogleEvent,
  GoogleCalendarEvent,
} from '@/lib/google-calendar';

interface SyncMapping {
  id: string;
  user_id: string;
  local_event_id: string;
  google_event_id: string;
  google_calendar_id: string;
  last_synced_at: string;
  sync_status: string;
}

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Initialize Google APIs on mount
  useEffect(() => {
    const init = async () => {
      try {
        await loadGoogleApis();
        setIsConnected(isAuthenticated());
      } catch (error) {
        console.error('Failed to load Google APIs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Connect to Google Calendar
  const connect = useCallback(async () => {
    setIsLoading(true);
    try {
      await signIn();
      setIsConnected(true);
      toast({
        title: 'Conectado ao Google Calendar',
        description: 'Sua conta foi vinculada com sucesso.',
      });
      return true;
    } catch (error) {
      console.error('Failed to connect to Google Calendar:', error);
      toast({
        title: 'Erro ao conectar',
        description: 'Não foi possível conectar ao Google Calendar.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Disconnect from Google Calendar
  const disconnect = useCallback(() => {
    signOut();
    setIsConnected(false);
    toast({
      title: 'Desconectado',
      description: 'Sua conta do Google Calendar foi desvinculada.',
    });
  }, [toast]);

  // Get sync mapping for a local event
  const getSyncMapping = useCallback(async (localEventId: string): Promise<SyncMapping | null> => {
    const { data } = await supabase
      .from('mf_google_calendar_sync')
      .select('*')
      .eq('local_event_id', localEventId)
      .single();
    
    return data as SyncMapping | null;
  }, []);

  // Create sync mapping
  const createSyncMapping = useCallback(async (
    localEventId: string,
    googleEventId: string
  ): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('mf_google_calendar_sync').insert({
      user_id: user.id,
      local_event_id: localEventId,
      google_event_id: googleEventId,
      google_calendar_id: 'primary',
      sync_status: 'synced',
    });
  }, []);

  // Delete sync mapping
  const deleteSyncMapping = useCallback(async (localEventId: string): Promise<void> => {
    await supabase
      .from('mf_google_calendar_sync')
      .delete()
      .eq('local_event_id', localEventId);
  }, []);

  // Sync a single event to Google Calendar
  const syncEventToGoogle = useCallback(async (event: {
    id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    type: string;
  }): Promise<boolean> => {
    if (!isConnected) return false;

    try {
      const existingMapping = await getSyncMapping(event.id);
      const googleEvent = toGoogleEvent(event);

      if (existingMapping) {
        // Update existing event
        const result = await updateGoogleEvent(existingMapping.google_event_id, googleEvent);
        if (!result.success) {
          console.error('Failed to update Google event:', result.error);
          return false;
        }
      } else {
        // Create new event
        const result = await createGoogleEvent(googleEvent);
        if (!result.success || !result.googleEventId) {
          console.error('Failed to create Google event:', result.error);
          return false;
        }
        await createSyncMapping(event.id, result.googleEventId);
      }

      return true;
    } catch (error) {
      console.error('Error syncing event to Google:', error);
      return false;
    }
  }, [isConnected, getSyncMapping, createSyncMapping]);

  // Delete event from Google Calendar
  const deleteEventFromGoogle = useCallback(async (localEventId: string): Promise<boolean> => {
    if (!isConnected) return false;

    try {
      const mapping = await getSyncMapping(localEventId);
      if (!mapping) return true; // No mapping, nothing to delete

      const result = await deleteGoogleEvent(mapping.google_event_id);
      if (result.success) {
        await deleteSyncMapping(localEventId);
      }
      return result.success;
    } catch (error) {
      console.error('Error deleting event from Google:', error);
      return false;
    }
  }, [isConnected, getSyncMapping, deleteSyncMapping]);

  // Sync all events from app to Google Calendar
  const syncAllToGoogle = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (!isConnected) {
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;

    try {
      // Get all local events
      const { data: events } = await supabase
        .from('mf_calendar_events')
        .select('*');

      if (events) {
        for (const event of events) {
          const success = await syncEventToGoogle(event);
          if (success) {
            synced++;
          } else {
            failed++;
          }
        }
      }

      setLastSyncTime(new Date());
      toast({
        title: 'Sincronização concluída',
        description: `${synced} eventos sincronizados${failed > 0 ? `, ${failed} falharam` : ''}.`,
      });
    } catch (error) {
      console.error('Error syncing all events:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Ocorreu um erro ao sincronizar eventos.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }

    return { synced, failed };
  }, [isConnected, syncEventToGoogle, toast]);

  // Get events from Google Calendar
  const getGoogleEvents = useCallback(async (
    startDate?: Date,
    endDate?: Date
  ): Promise<GoogleCalendarEvent[]> => {
    if (!isConnected) return [];

    try {
      return await getGoogleCalendarEvents(startDate, endDate);
    } catch (error) {
      console.error('Error fetching Google events:', error);
      return [];
    }
  }, [isConnected]);

  return {
    isConnected,
    isLoading,
    isSyncing,
    lastSyncTime,
    connect,
    disconnect,
    syncEventToGoogle,
    deleteEventFromGoogle,
    syncAllToGoogle,
    getGoogleEvents,
  };
}
