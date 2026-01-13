import { BookOpen } from "lucide-react";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalList } from "@/components/journal/JournalList";
import type { JournalEntry } from "@/types";

interface JournalPageProps {
  isJournalEditing: boolean;
  editingJournalEntry: JournalEntry | null;
  handleSaveJournalEntry: (entry: Partial<JournalEntry>) => void;
  setIsJournalEditing: (val: boolean) => void;
  setEditingJournalEntry: (entry: JournalEntry | null) => void;
  journalEntries: JournalEntry[];
  journalLoading: boolean;
  handleDeleteJournalEntry: (id: string) => void;
}

export function JournalPage({
  isJournalEditing,
  editingJournalEntry,
  handleSaveJournalEntry,
  setIsJournalEditing,
  setEditingJournalEntry,
  journalEntries,
  journalLoading,
  handleDeleteJournalEntry,
}: JournalPageProps) {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <BookOpen className="h-8 w-8 text-primary" />
          Diário
        </h1>
        <p className="text-muted-foreground">
          Registre seus pensamentos e experiências
        </p>
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        {isJournalEditing ? (
          <JournalEditor
            entry={editingJournalEntry}
            onSave={handleSaveJournalEntry}
            onCancel={() => {
              setIsJournalEditing(false);
              setEditingJournalEntry(null);
            }}
          />
        ) : (
          <JournalList
            entries={journalEntries}
            loading={journalLoading}
            onCreateNew={() => {
              setEditingJournalEntry(null);
              setIsJournalEditing(true);
            }}
            onEdit={(entry) => {
              setEditingJournalEntry(entry);
              setIsJournalEditing(true);
            }}
            onDelete={handleDeleteJournalEntry}
          />
        )}
      </div>
    </div>
  );
}
