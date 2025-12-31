import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Upload, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { CalendarEvent, downloadICS, importICSFile } from "@/lib/calendar-ics";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CalendarSyncProps {
  events: CalendarEvent[];
  onImport: (events: CalendarEvent[]) => void;
}

export function CalendarSync({ events, onImport }: CalendarSyncProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = () => {
    setIsExporting(true);
    try {
      downloadICS(events);
      toast({
        title: "Calendário exportado!",
        description: `${events.length} eventos exportados para arquivo .ics`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o calendário.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const importedEvents = await importICSFile(file);
      onImport(importedEvents);
      setImportResult({ success: true, count: importedEvents.length });
      toast({
        title: "Eventos importados!",
        description: `${importedEvents.length} eventos foram adicionados ao seu calendário.`,
      });
    } catch (error) {
      setImportResult({ success: false, count: 0 });
      toast({
        title: "Erro ao importar",
        description: "Não foi possível ler o arquivo .ics",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-foreground">Sincronizar Calendário</h4>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Exporte seus eventos para Google Calendar, Apple Calendar ou Outlook usando arquivos .ics
      </p>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          disabled={isExporting || events.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar ({events.length})
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleImportClick}
          disabled={isImporting}
        >
          <Upload className="mr-2 h-4 w-4" />
          Importar .ics
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".ics"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {importResult && (
        <div className={cn(
          "mt-3 flex items-center gap-2 rounded-lg p-2 text-sm",
          importResult.success 
            ? "bg-status-completed/10 text-status-completed" 
            : "bg-destructive/10 text-destructive"
        )}>
          {importResult.success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {importResult.count} eventos importados
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              Erro ao importar arquivo
            </>
          )}
        </div>
      )}

      <div className="mt-4 rounded-lg bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          <strong>Como usar:</strong><br />
          1. Clique em "Exportar" para baixar seus eventos<br />
          2. Abra o arquivo .ics no seu app de calendário<br />
          3. Ou importe eventos de outros calendários aqui
        </p>
      </div>
    </div>
  );
}
