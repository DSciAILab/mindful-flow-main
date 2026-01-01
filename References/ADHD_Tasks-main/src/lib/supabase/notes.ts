import { supabase, APP_ID } from "@/integrations/supabase/client";

// Função auxiliar para gerar e salvar o embedding
const generateAndSaveEmbedding = async (noteId: string, content: string) => {
  try {
    await supabase.functions.invoke('update-note-embedding', {
      body: { noteId, content },
    });
  } catch (error) {
    console.error("Falha ao gerar embedding para a nota:", error);
    // Não bloqueia a UI, apenas registra o erro
  }
};

export const getNotes = async (userId: string): Promise<{ id: string; content: string; project_id: string | null; project: string | null; hashtags: string[] }[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select('id, content, project_id, hashtags, projects(name)')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
  console.log("notes.ts: getNotes - Raw data from Supabase for user", userId, ":", data); // DEBUG
  // CORRIGIDO: Tipagem explícita do parâmetro 'note' no map para lidar com a inferência de 'projects' como array
  return data.map((note: { id: string; content: string; project_id: string | null; hashtags: string[]; projects: { name: string }[] | null }) => ({
    ...note,
    project: note.projects?.[0]?.name || null, // Acessa o primeiro elemento do array
  }));
};

export const getArchivedNotes = async (userId: string): Promise<{ id: string; content: string; project_id: string | null; project: string | null; hashtags: string[] }[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select('id, content, project_id, hashtags, projects(name)')
    .eq('user_id', userId)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching archived notes:", error);
    return [];
  }
  console.log("notes.ts: getArchivedNotes - Raw data from Supabase for user", userId, ":", data); // DEBUG
  // CORRIGIDO: Tipagem explícita do parâmetro 'note' no map para lidar com a inferência de 'projects' como array
  return data.map((note: { id: string; content: string; project_id: string | null; hashtags: string[]; projects: { name: string }[] | null }) => ({
    ...note,
    project: note.projects?.[0]?.name || null, // Acessa o primeiro elemento do array
  }));
};

export const addNote = async (userId: string, note: { content: string; project_id: string | null; hashtags: string[] }): Promise<{ id: string } | null> => {
  console.log("notes.ts: addNote - Inserting note with project_id:", note.project_id, "content:", note.content.substring(0, 30) + "..."); // DEBUG
  const { data, error } = await supabase.from('notes').insert({
    user_id: userId,
    content: note.content,
    project_id: note.project_id,
    hashtags: note.hashtags,
    is_archived: false,
    app_id: APP_ID,
  }).select('id').single();

  if (error) {
    console.error("Error adding note:", error);
    return null;
  }

  if (data) {
    generateAndSaveEmbedding(data.id, note.content);
  }

  return data;
};

export const updateNote = async (userId: string, noteId: string, updates: { content?: string; project_id?: string | null; hashtags?: string[] }): Promise<boolean> => {
  console.log("notes.ts: updateNote - Updating note", noteId, "with project_id:", updates.project_id, "content:", updates.content?.substring(0, 30) + "..."); // DEBUG
  const { error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .eq('user_id', userId);
  if (error) {
    console.error("Error updating note:", error);
    return false;
  }

  if (updates.content) {
    generateAndSaveEmbedding(noteId, updates.content);
  }

  return true;
};

export const setNoteArchived = async (userId: string, noteId: string, archived: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('notes')
    .update({ is_archived: archived })
    .eq('id', noteId)
    .eq('user_id', userId);
  if (error) {
    console.error("Error setting note archive status:", error);
    return false;
  }
  return true;
};

export const deleteNote = async (userId: string, noteId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);
  if (error) {
    console.error("Error deleting note:", error);
    return false;
  }
  return true;
};