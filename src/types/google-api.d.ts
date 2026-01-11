/**
 * TypeScript type definitions for Google APIs used in the project
 * These extend the existing gapi types with Calendar API specifics
 */

declare namespace gapi {
  namespace client {
    namespace calendar {
      interface EventsListParameters {
        calendarId: string;
        timeMin?: string;
        timeMax?: string;
        showDeleted?: boolean;
        singleEvents?: boolean;
        maxResults?: number;
        orderBy?: 'startTime' | 'updated';
        pageToken?: string;
      }

      interface EventDateTime {
        dateTime?: string;
        date?: string;
        timeZone?: string;
      }

      interface Event {
        id?: string;
        summary?: string;
        description?: string;
        start?: EventDateTime;
        end?: EventDateTime;
        colorId?: string;
        status?: string;
        htmlLink?: string;
        created?: string;
        updated?: string;
      }

      interface EventsListResponse {
        result: {
          items?: Event[];
          nextPageToken?: string;
        };
      }

      interface EventInsertResponse {
        result: Event;
      }

      const events: {
        list(params: EventsListParameters): Promise<EventsListResponse>;
        insert(params: { calendarId: string; resource: object }): Promise<EventInsertResponse>;
        patch(params: { calendarId: string; eventId: string; resource: object }): Promise<EventInsertResponse>;
        delete(params: { calendarId: string; eventId: string }): Promise<void>;
      };
    }

    function init(config: { discoveryDocs: string[] }): Promise<void>;
    function getToken(): { access_token: string } | null;
    function setToken(token: { access_token: string } | null): void;
  }

  function load(name: string, callback: () => void): void;
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback: (response: TokenResponse) => void;
        requestAccessToken(options: { prompt?: string }): void;
      }

      interface TokenResponse {
        access_token?: string;
        error?: string;
        expires_in?: number;
        scope?: string;
        token_type?: string;
      }

      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }): TokenClient;

      function revoke(token: string, callback?: () => void): void;
    }
  }
}
