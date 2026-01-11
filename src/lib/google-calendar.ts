/**
 * Google Calendar API Integration Service
 * 
 * This module provides OAuth 2.0 authentication and CRUD operations
 * for syncing events with Google Calendar.
 */

// Google API configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

// State management
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiInitialized = false;
let gisInitialized = false;

// Token storage keys
const TOKEN_STORAGE_KEY = 'mf_google_calendar_token';
const TOKEN_EXPIRY_KEY = 'mf_google_calendar_token_expiry';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
  status?: string;
}

export interface SyncResult {
  success: boolean;
  googleEventId?: string;
  error?: string;
}

/**
 * Load the Google API client library and Google Identity Services
 */
export async function loadGoogleApis(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (gapiInitialized && gisInitialized) {
      resolve();
      return;
    }

    // Load GAPI
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInitialized = true;
          
          // Check for stored token
          const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
          const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
          
          if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            gapi.client.setToken({ access_token: storedToken });
          }
          
          if (gisInitialized) resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
    gapiScript.onerror = reject;
    document.head.appendChild(gapiScript);

    // Load GIS (Google Identity Services)
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      if (!GOOGLE_CLIENT_ID) {
        console.warn('Google Calendar: VITE_GOOGLE_CLIENT_ID not configured');
        gisInitialized = true;
        if (gapiInitialized) resolve();
        return;
      }

      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: () => {}, // Will be set during signIn
      });
      gisInitialized = true;
      if (gapiInitialized) resolve();
    };
    gisScript.onerror = reject;
    document.head.appendChild(gisScript);
  });
}

/**
 * Check if the user is currently authenticated with Google Calendar
 */
export function isAuthenticated(): boolean {
  const token = gapi?.client?.getToken();
  const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (token && storedExpiry && Date.now() < parseInt(storedExpiry)) {
    return true;
  }
  
  return false;
}

/**
 * Sign in to Google Calendar
 */
export function signIn(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google API not initialized. Please configure VITE_GOOGLE_CLIENT_ID.'));
      return;
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      
      // Store token and expiry
      const token = gapi.client.getToken();
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token.access_token);
        // Token expires in 1 hour (3600 seconds)
        const expiryTime = Date.now() + (response.expires_in || 3600) * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      
      resolve(true);
    };

    // Check if we need to prompt for consent
    const token = gapi.client.getToken();
    if (token === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

/**
 * Sign out from Google Calendar
 */
export function signOut(): void {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Google Calendar token revoked');
    });
    gapi.client.setToken(null);
  }
  
  // Clear stored tokens
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Get events from Google Calendar
 */
export async function getGoogleCalendarEvents(
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 100
): Promise<GoogleCalendarEvent[]> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Google Calendar');
  }

  const params: gapi.client.calendar.EventsListParameters = {
    calendarId: 'primary',
    timeMin: timeMin ? timeMin.toISOString() : new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults,
    orderBy: 'startTime',
  };

  if (timeMax) {
    params.timeMax = timeMax.toISOString();
  }

  const response = await gapi.client.calendar.events.list(params);
  
  return (response.result.items || []).map((item) => ({
    id: item.id,
    summary: item.summary || '',
    description: item.description,
    start: {
      dateTime: item.start?.dateTime || item.start?.date || '',
      timeZone: item.start?.timeZone,
    },
    end: {
      dateTime: item.end?.dateTime || item.end?.date || '',
      timeZone: item.end?.timeZone,
    },
    colorId: item.colorId,
    status: item.status,
  }));
}

/**
 * Create an event in Google Calendar
 */
export async function createGoogleEvent(event: GoogleCalendarEvent): Promise<SyncResult> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Not authenticated with Google Calendar' };
  }

  try {
    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return {
      success: true,
      googleEventId: response.result.id,
    };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an event in Google Calendar
 */
export async function updateGoogleEvent(
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<SyncResult> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Not authenticated with Google Calendar' };
  }

  try {
    const response = await gapi.client.calendar.events.patch({
      calendarId: 'primary',
      eventId,
      resource: event,
    });

    return {
      success: true,
      googleEventId: response.result.id,
    };
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteGoogleEvent(eventId: string): Promise<SyncResult> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Not authenticated with Google Calendar' };
  }

  try {
    await gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Map event type to Google Calendar color
 * Google Calendar colors: https://developers.google.com/calendar/api/v3/reference/colors/get
 */
export function getGoogleColorId(type: string): string {
  const colorMap: Record<string, string> = {
    focus: '9',     // Bold Blue
    meeting: '7',   // Cyan
    break: '2',     // Green
    personal: '6',  // Orange
    routine: '8',   // Gray
  };
  return colorMap[type] || '1'; // Default: Lavender
}

/**
 * Convert local event to Google Calendar event format
 */
export function toGoogleEvent(event: {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  type: string;
}): GoogleCalendarEvent {
  return {
    summary: event.title,
    description: event.description || undefined,
    start: {
      dateTime: event.start_time,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: event.end_time,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: getGoogleColorId(event.type),
  };
}
