"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from "@/integrations/supabase/auth";
import { supabaseDb } from "@/lib/supabase/index";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Plus, Pencil, Trash2, ChevronsUpDown, LayoutGrid, List, Archive, ArchiveRestore, ChevronDown, Search, X, Folder, Tag, ListChecks, Mic, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder"; // NEW IMPORT
import { Project } from "@/lib/supabase/projects"; // NEW IMPORT

interface Note {
  id: string;
  content: string;
  project_id: string | null; // NEW: Usar project_id
  project: string | null; // NEW: Para exibição
  hashtags: string[];
}

const Notes = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const userId = user?.id;

  const [notes, setNotes] = useState<Note[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]); // NEW: Lista de objetos Project
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null); // NEW: Usar ID do projeto
  const [newProjectNameInput, setNewProjectNameInput] = useState(""); // NEW: Para o input do combobox
  const [noteHashtags, setNoteHashtags] = useState("");
  const [isProjectComboboxOpen, setIsProjectComboboxOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [groupingMode, setGroupingMode] = useState<'project' | 'tag' | 'none'>('project');

  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceRecorder(); // NEW

  const loadData = useCallback(async () => {
    if (userId) {
      const [userNotes, userArchivedNotes, allProjects] = await Promise.all([
        supabaseDb.getNotes(userId),
        supabaseDb.getArchivedNotes(userId),
        supabaseDb.getProjects(userId), // NEW: Buscar a lista completa de projetos
      ]);
      setNotes(userNotes);
      setArchivedNotes(userArchivedNotes);
      setProjectsList(allProjects); // NEW: Define a lista de objetos Project
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('search-notes', {
          body: { query: searchQuery },
        });
        if (error) throw error;
        setSearchResults(data.notes);
      } catch (error: any) {
        toast.error(`Erro na busca: ${error.message}`);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const groupedNotes = useMemo(() => {
    const notesToGroup = searchResults === null ? notes : searchResults;
    if (groupingMode === 'project') {
      return notesToGroup.reduce((acc, note) => {
        const key = note.project ? `@${note.project}` : "Sem Projeto";
        if (!acc[key]) acc[key] = [];
        acc[key].push(note);
        return acc;
      }, {} as Record<string, Note[]>);
    } else if (groupingMode === 'tag') {
      return notesToGroup.reduce((acc, note) => {
        if (note.hashtags.length === 0) {
          const key = "Sem Tag";
          if (!acc[key]) acc[key] = [];
          acc[key].push(note);
        } else {
          note.hashtags.forEach(tag => {
            const key = `#${tag}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(note);
          });
        }
        return acc;
      }, {} as Record<string, Note[]>);
    }
    return null;
  }, [notes, searchResults, groupingMode]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const handleOpenDialog = (note: Note | null = null) => {
    setEditingNote(note);
    setNoteContent(note?.content || "");
    setSelectedProjectId(note?.project_id || null); // Usar project_id
    setNewProjectNameInput(projectsList.find(p => p.id === note?.project_id)?.name || ""); // Preencher input com nome
    setNoteHashtags(note?.hashtags.join(" ") || "");
    setIsDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!userId || !noteContent.trim()) {
      toast.error("O conteúdo da nota não pode estar vazio.");
      return;
    }
    const hashtagsArray = noteHashtags.split(" ").filter(tag => tag.trim() !== "");

    let finalProjectId = selectedProjectId;
    // Se o usuário digitou um novo nome de projeto no combobox, precisamos criá-lo
    if (newProjectNameInput && !selectedProjectId) {
      const existingProject = projectsList.find(p => p.name.toLowerCase() === newProjectNameInput.toLowerCase());
      if (existingProject) {
        finalProjectId = existingProject.id;
      } else {
        // CORRIGIDO: Passando todos os campos opcionais como null
        const newProject = await supabaseDb.addProject(userId, { name: newProjectNameInput, description: null, woop_wish: null, woop_outcome: null, woop_obstacle: null, woop_plan: null, smart_specific: null, smart_measurable: null, smart_achievable: null, smart_relevant: null, smart_time_bound: null });
        if (newProject) {
          finalProjectId = newProject.id;
          toast.success(`Novo projeto "${newProject.name}" criado!`);
          loadData(); // Recarregar para atualizar a lista de projetos
        } else {
          toast.error("Falha ao criar novo projeto.");
          return;
        }
      }
    }

    const noteData = { content: noteContent.trim(), project_id: finalProjectId, hashtags: hashtagsArray }; // Usar project_id
    const success = editingNote ? await supabaseDb.updateNote(userId, editingNote.id, noteData) : !!(await supabaseDb.addNote(userId, noteData));
    if (success) {
      toast.success(`Nota ${editingNote ? 'atualizada' : 'adicionada'} com sucesso!`);
      setIsDialogOpen(false);
      loadData();
    } else {
      toast.error(`Falha ao ${editingNote ? 'atualizar' : 'adicionar'} a nota.`);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!userId) return;
    if (await supabaseDb.deleteNote(userId, noteId)) {
      toast.success("Nota deletada com sucesso!");
      loadData();
    } else {
      toast.error("Falha ao deletar a nota.");
    }
  };

  const handleSetArchived = async (noteId: string, archive: boolean) => {
    if (!userId) return;
    if (await supabaseDb.setNoteArchived(userId, noteId, archive)) {
      toast.success(`Nota ${archive ? 'arquivada' : 'desarquivada'} com sucesso!`);
      loadData();
    } else {
      toast.error("Falha ao atualizar a nota.");
    }
  };

  const handleGroupingChange = () => {
    if (groupingMode === 'project') setGroupingMode('tag');
    else if (groupingMode === 'tag') setGroupingMode('none');
    else setGroupingMode('project');
  };

  const handleViewChange = () => {
    setViewMode(prev => (prev === 'card' ? 'list' : 'card'));
  };

  const handleVoiceCapture = () => { // NEW
    if (isRecording) {
      stopRecording();
    } else {
      startRecording((transcript) => {
        setNoteContent(prev => `${prev} ${transcript}`.trim());
      });
    }
  };

  const groupingTooltip = {
    project: "Agrupar por Tags",
    tag: "Remover Agrupamento",
    none: "Agrupar por Projetos",
  };

  const groupingIcon = {
    project: <Folder className="h-4 w-4" />,
    tag: <Tag className="h-4 w-4" />,
    none: <ListChecks className="h-4 w-4" />,
  };

  if (isSessionLoading) {
    return <Layout><div>Carregando...</div></Layout>;
  }

  const renderNoteList = (noteList: Note[], isArchivedList: boolean) => {
    const NoteComponent = ({ note }: { note: Note }) => (
      <div className="flex items-start justify-between p-3 border rounded-md hover:bg-accent bg-secondary">
        <div className="flex-grow">
          {groupingMode !== 'project' && note.project && <p className="text-sm font-semibold text-primary">@{note.project}</p>}
          <p className="whitespace-pre-wrap text-sm">{note.content}</p>
          {groupingMode !== 'tag' && (
            <div className="flex gap-2 flex-wrap mt-2">
              {note.hashtags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
            </div>
          )}
        </div>
        <div className="flex gap-1 ml-4 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(note)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleSetArchived(note.id, !isArchivedList)}>{isArchivedList ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    );

    const CardComponent = ({ note }: { note: Note }) => (
      <Card key={note.id} className="flex flex-col bg-secondary">
        <CardHeader>
          {groupingMode !== 'project' && note.project && <CardTitle className="text-lg">@{note.project}</CardTitle>}
        </CardHeader>
        <CardContent className="flex-grow"><p className="whitespace-pre-wrap">{note.content}</p></CardContent>
        <div className="p-4 border-t flex justify-between items-center">
          {groupingMode !== 'tag' ? (
            <div className="flex gap-2 flex-wrap">
              {note.hashtags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
            </div>
          ) : <div />}
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(note)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleSetArchived(note.id, !isArchivedList)}>{isArchivedList ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    );

    if (viewMode === 'card') {
      return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{noteList.map(note => <CardComponent key={note.id} note={note} />)}</div>;
    }
    return <div className="space-y-2">{noteList.map(note => <NoteComponent key={note.id} note={note} />)}</div>;
  };

  const notesToDisplay = searchResults === null ? notes : searchResults;

  const headerActions = (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={handleGroupingChange}>
            {groupingIcon[groupingMode]}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{groupingTooltip[groupingMode]}</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={handleViewChange}>
            {viewMode === 'card' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{viewMode === 'card' ? 'Visualizar como Lista' : 'Visualizar como Grade'}</p>
        </TooltipContent>
      </Tooltip>
      <Button onClick={() => handleOpenDialog()}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Nota
      </Button>
    </div>
  );

  const currentProjectName = projectsList.find(p => p.id === selectedProjectId)?.name || newProjectNameInput;

  return (
    <Layout headerActions={headerActions} onNoteAdded={loadData}>
      <div className="p-4 space-y-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Busque suas notas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          {searchQuery && <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6" onClick={clearSearch}><X className="h-4 w-4" /></Button>}
        </div>

        {isSearching ? (
          <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
        ) : notesToDisplay.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            <p>{searchResults !== null ? "Nenhum resultado encontrado." : "Nenhuma nota encontrada."}</p>
            {searchResults === null && <p className="text-sm">Use a captura rápida com ": " para adicionar sua primeira nota.</p>}
          </div>
        ) : groupingMode === 'none' ? (
          renderNoteList(notesToDisplay, false)
        ) : (
          <div className="space-y-4">
            {groupedNotes && Object.entries(groupedNotes).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, groupNotes]) => (
              <Collapsible key={groupName} defaultOpen className="border rounded-lg">
                <CollapsibleTrigger className="w-full p-3 hover:bg-accent rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">{groupName} <Badge variant="secondary" className="ml-2">{groupNotes.length}</Badge></h2>
                    <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 pt-0">{renderNoteList(groupNotes, false)}</CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        {searchResults === null && archivedNotes.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild><Button variant="outline" className="w-full justify-between"><span>Notas Arquivadas ({archivedNotes.length})</span><ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" /></Button></CollapsibleTrigger>
            <CollapsibleContent className="mt-4">{renderNoteList(archivedNotes, true)}</CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingNote ? "Editar Nota" : "Adicionar Nova Nota"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note-content">Conteúdo</Label>
              <div className="flex items-center gap-2"> {/* NEW: Flex container for Textarea and Button */}
                <Textarea
                  id="note-content"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder={isTranscribing ? "A transcrever..." : "Sua nota..."}
                  rows={6}
                  disabled={isTranscribing} // NEW: Disable during transcription
                />
                <Button
                  size="icon"
                  onClick={handleVoiceCapture}
                  disabled={isTranscribing} // NEW: Disable during transcription
                  variant={isRecording ? "destructive" : "outline"} // NEW: Change variant when recording
                >
                  {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />} {/* NEW: Toggle icon */}
                  <span className="sr-only">{isRecording ? "Parar Gravação" : "Iniciar Gravação"}</span>
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note-project">Projeto</Label>
              <Popover open={isProjectComboboxOpen} onOpenChange={setIsProjectComboboxOpen}>
                <PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={isProjectComboboxOpen} className="w-full justify-between">{currentProjectName || "Selecione ou crie um projeto..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar ou criar projeto..." value={newProjectNameInput} onValueChange={setNewProjectNameInput} />
                    <CommandEmpty>
                      {newProjectNameInput ? `Criar "${newProjectNameInput}"` : "Nenhum projeto encontrado."}
                    </CommandEmpty>
                    <CommandGroup>
                      {projectsList.map(p => (<CommandItem key={p.id} value={p.name} onSelect={currentValue => {
                        const selected = projectsList.find(proj => proj.name.toLowerCase() === currentValue.toLowerCase());
                        setSelectedProjectId(selected?.id || null);
                        setNewProjectNameInput(selected?.name || "");
                        setIsProjectComboboxOpen(false);
                      }}>{p.name}</CommandItem>))}</CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2"><Label htmlFor="note-hashtags">Tags</Label><Input id="note-hashtags" value={noteHashtags} onChange={e => setNoteHashtags(e.target.value)} placeholder="tag1 tag2 (separadas por espaço)" /></div>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSaveNote}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Notes;