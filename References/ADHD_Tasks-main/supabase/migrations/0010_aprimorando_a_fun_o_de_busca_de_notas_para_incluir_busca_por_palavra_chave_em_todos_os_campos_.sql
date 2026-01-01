CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(768),
  query_text text,
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
  WITH combined_searches AS (
    -- Busca por palavra-chave no conteúdo, projeto e tags
    SELECT
      notes.id,
      notes.content,
      notes.project,
      notes.hashtags,
      1.0 AS similarity -- Atribui uma pontuação alta para correspondências diretas
    FROM notes
    WHERE
      notes.is_archived = false AND (
        notes.content ILIKE '%' || query_text || '%' OR
        notes.project ILIKE '%' || query_text || '%' OR
        EXISTS (
          SELECT 1
          FROM unnest(notes.hashtags) AS tag
          WHERE tag ILIKE '%' || query_text || '%'
        )
      )
    UNION
    -- Busca semântica (vetorial) no conteúdo
    SELECT
      notes.id,
      notes.content,
      notes.project,
      notes.hashtags,
      1 - (notes.embedding <=> query_embedding) as similarity
    FROM notes
    WHERE 
      1 - (notes.embedding <=> query_embedding) > match_threshold AND
      notes.is_archived = false
  )
  -- Agrupa os resultados para remover duplicatas e pega a maior pontuação de similaridade
  SELECT
    id,
    content,
    project,
    hashtags,
    MAX(similarity) as similarity
  FROM combined_searches
  GROUP BY id, content, project, hashtags
  ORDER BY similarity DESC
  LIMIT match_count;
$$;