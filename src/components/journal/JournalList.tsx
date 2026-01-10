import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JournalEntryCard } from "./JournalEntryCard";
import { 
  Search, 
  Plus, 
  BookOpen,
  Loader2
} from "lucide-react";
import type { JournalEntry } from "@/types";

interface JournalListProps {
  entries: JournalEntry[];
  loading: boolean;
  onCreateNew: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

export function JournalList({ entries, loading, onCreateNew, onEdit, onDelete }: JournalListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase();
    return entries.filter((entry) => 
      entry.title?.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    const now = new Date();
    
    filteredEntries.forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let groupKey: string;
      if (diffDays === 0) {
        groupKey = 'Hoje';
      } else if (diffDays === 1) {
        groupKey = 'Ontem';
      } else if (diffDays < 7) {
        groupKey = 'Esta semana';
      } else if (diffDays < 30) {
        groupKey = 'Este mês';
      } else {
        groupKey = entryDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(entry);
    });
    
    return groups;
  }, [filteredEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and create */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar no diário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold text-foreground">Seu diário está vazio</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece a registrar seus pensamentos, sentimentos e experiências.
          </p>
          <Button onClick={onCreateNew} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Criar primeira entrada
          </Button>
        </div>
      )}

      {/* No results */}
      {entries.length > 0 && filteredEntries.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma entrada encontrada para "{searchQuery}"
          </p>
        </div>
      )}

      {/* Grouped entries */}
      {Object.entries(groupedEntries).map(([group, groupEntries]) => (
        <div key={group}>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">{group}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {groupEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
