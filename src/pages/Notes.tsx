import { useState, useMemo } from "react";
import { FileText, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteCreateModal } from "@/components/notes/NoteCreateModal";
import { NoteEditModal } from "@/components/notes/NoteEditModal";
import { useNotes, Note, NoteInput } from "@/hooks/useNotes";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { LIFE_AREAS, getLifeAreaById } from "@/lib/lifeAreas";
import { useToast } from "@/hooks/use-toast";

export function NotesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAreaId, setFilterAreaId] = useState<string>("all");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");

  const { notes, loading, addNote, updateNote, deleteNote, togglePin } = useNotes();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { toast } = useToast();

  // Filter and search notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));

      // Area filter
      const matchesArea = filterAreaId === "all" || note.area_id === filterAreaId;

      // Project filter
      const matchesProject =
        filterProjectId === "all" || note.project_id === filterProjectId;

      return matchesSearch && matchesArea && matchesProject;
    });
  }, [notes, searchQuery, filterAreaId, filterProjectId]);

  const handleCreateNote = async (noteInput: NoteInput) => {
    const result = await addNote(noteInput);
    if (result) {
      toast({
        title: "Nota criada!",
        description: "Sua nota foi salva com sucesso.",
      });
    }
    return result;
  };

  const handleUpdateNote = async (id: string, updates: Partial<NoteInput>) => {
    const result = await updateNote(id, updates);
    if (result) {
      toast({
        title: "Nota atualizada!",
        description: "Suas alterações foram salvas.",
      });
    }
    return result;
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
  };

  const handleTogglePin = async (id: string, currentStatus: boolean) => {
    await togglePin(id, currentStatus);
    toast({
      title: currentStatus ? "Nota desafixada" : "Nota fixada!",
      description: currentStatus
        ? "A nota foi removida dos favoritos."
        : "A nota será exibida primeiro.",
    });
  };

  // Get display names for associations
  const getProjectName = (projectId: string | null | undefined) => {
    if (!projectId) return undefined;
    return projects.find((p) => p.id === projectId)?.name;
  };

  const getTaskTitle = (taskId: string | null | undefined) => {
    if (!taskId) return undefined;
    return tasks.find((t) => t.id === taskId)?.title;
  };

  const getAreaName = (areaId: string) => {
    return getLifeAreaById(areaId)?.name;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <FileText className="h-8 w-8 text-primary" />
          Notas
        </h1>
        <p className="text-muted-foreground">
          Organize suas ideias, reflexões e anotações
        </p>
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-col sm:flex-row gap-3 animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar notas..."
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterAreaId} onValueChange={setFilterAreaId}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Áreas</SelectItem>
              {LIFE_AREAS.map((area) => {
                const Icon = area.icon;
                return (
                  <SelectItem key={area.id} value={area.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: area.color }} />
                      {area.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select value={filterProjectId} onValueChange={setFilterProjectId}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Nota
          </Button>
        </div>
      </div>

      {/* Notes Grid */}
      <div
        className="animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/30">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery || filterAreaId !== "all" || filterProjectId !== "all"
                ? "Nenhuma nota encontrada"
                : "Nenhuma nota ainda"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterAreaId !== "all" || filterProjectId !== "all"
                ? "Tente ajustar os filtros de busca."
                : "Crie sua primeira nota para começar!"}
            </p>
            {!searchQuery && filterAreaId === "all" && filterProjectId === "all" && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Nota
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                projectName={getProjectName(note.project_id)}
                taskTitle={getTaskTitle(note.task_id)}
                areaName={getAreaName(note.area_id)}
                onEdit={setEditingNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <NoteCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateNote}
        projects={projects}
        tasks={tasks}
      />

      {/* Edit Modal */}
      <NoteEditModal
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        onSave={handleUpdateNote}
        note={editingNote}
        projects={projects}
        tasks={tasks}
      />
    </div>
  );
}
