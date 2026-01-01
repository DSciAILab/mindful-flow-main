-- Habilita a extensão pgvector se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS vector;

-- Adiciona a coluna de embedding à tabela de notas
ALTER TABLE public.notes ADD COLUMN embedding vector(768);

-- Cria uma função para buscar notas por similaridade de vetores
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  project text,
  hashtags text[],
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    notes.id,
    notes.content,
    notes.project,
    notes.hashtags,
    1 - (notes.embedding <=> query_embedding) as similarity
  FROM notes
  WHERE 1 - (notes.embedding <=> query_embedding) > match_threshold
  AND notes.is_archived = false
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Cria um índice para acelerar a busca por vetores
CREATE INDEX ON public.notes USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);