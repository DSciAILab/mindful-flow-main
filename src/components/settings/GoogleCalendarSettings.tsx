import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Link2,
  Link2Off,
  ExternalLink,
} from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { cn } from "@/lib/utils";

export function GoogleCalendarSettings() {
  const {
    isConnected,
    isLoading,
    isSyncing,
    lastSyncTime,
    connect,
    disconnect,
    syncAllToGoogle,
  } = useGoogleCalendar();

  const [autoSync, setAutoSync] = useState(() => {
    return localStorage.getItem("mf_google_auto_sync") === "true";
  });

  const handleAutoSyncChange = (enabled: boolean) => {
    setAutoSync(enabled);
    localStorage.setItem("mf_google_auto_sync", enabled.toString());
  };

  const handleConnect = async () => {
    const success = await connect();
    if (success && autoSync) {
      await syncAllToGoogle();
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return "Nunca sincronizado";
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Agora mesmo";
    if (minutes < 60) return `Há ${minutes} minutos`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours} hora${hours > 1 ? "s" : ""}`;
    
    return lastSyncTime.toLocaleDateString("pt-BR");
  };

  const clientIdConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4285F4]/10">
          <Calendar className="h-5 w-5 text-[#4285F4]" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Google Calendar</h3>
          <p className="text-sm text-muted-foreground">
            Sincronize seus eventos automaticamente
          </p>
        </div>
      </div>

      {/* Status */}
      <div
        className={cn(
          "mb-4 flex items-center gap-2 rounded-lg p-3",
          isConnected
            ? "bg-status-completed/10 text-status-completed"
            : "bg-muted/30 text-muted-foreground"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Conectando...</span>
          </>
        ) : isConnected ? (
          <>
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Conectado</span>
            <span className="text-xs opacity-70">• {formatLastSync()}</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Não conectado</span>
          </>
        )}
      </div>

      {/* Configuration Warning */}
      {!clientIdConfigured && (
        <div className="mb-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Configuração necessária</p>
              <p className="mt-1 text-xs opacity-80">
                Adicione <code className="rounded bg-muted px-1">VITE_GOOGLE_CLIENT_ID</code> ao 
                seu arquivo <code className="rounded bg-muted px-1">.env</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-4">
        {isConnected ? (
          <>
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync" className="text-sm font-medium">
                  Sincronização automática
                </Label>
                <p className="text-xs text-muted-foreground">
                  Sincronizar ao criar/editar eventos
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={handleAutoSyncChange}
              />
            </div>

            {/* Manual Sync Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={syncAllToGoogle}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar agora
                </>
              )}
            </Button>

            {/* Disconnect Button */}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-destructive"
              onClick={disconnect}
            >
              <Link2Off className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </>
        ) : (
          <>
            {/* Connect Button */}
            <Button
              className="w-full bg-[#4285F4] hover:bg-[#3367D6]"
              onClick={handleConnect}
              disabled={isLoading || !clientIdConfigured}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Conectar com Google Calendar
                </>
              )}
            </Button>

            {/* Help Link */}
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
              Configurar credenciais no Google Cloud Console
            </a>
          </>
        )}
      </div>
    </div>
  );
}
