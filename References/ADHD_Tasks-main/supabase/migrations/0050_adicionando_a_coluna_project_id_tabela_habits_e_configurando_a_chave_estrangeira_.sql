-- Adiciona a nova coluna project_id à tabela habits
ALTER TABLE public.habits ADD COLUMN project_id UUID;

-- Adiciona a restrição de chave estrangeira
ALTER TABLE public.habits ADD CONSTRAINT fk_project
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Opcional: Se você quiser que 'project_id' seja NOT NULL, você precisaria garantir que todos os hábitos tenham um projeto associado.
-- ALTER TABLE public.habits ALTER COLUMN project_id SET NOT NULL;