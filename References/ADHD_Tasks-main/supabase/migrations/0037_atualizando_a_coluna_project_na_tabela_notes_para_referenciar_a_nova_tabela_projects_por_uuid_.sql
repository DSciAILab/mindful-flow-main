-- Adiciona uma nova coluna temporária para a chave estrangeira
ALTER TABLE public.notes ADD COLUMN project_id_temp UUID;

-- Remove a coluna 'project' antiga
ALTER TABLE public.notes DROP COLUMN project;

-- Renomeia a coluna temporária para 'project_id'
ALTER TABLE public.notes RENAME COLUMN project_id_temp TO project_id;

-- Adiciona a restrição de chave estrangeira
ALTER TABLE public.notes ADD CONSTRAINT fk_project
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Opcional: Se você quiser que 'project_id' seja NOT NULL, você precisaria garantir que todas as notas tenham um projeto associado.
-- ALTER TABLE public.notes ALTER COLUMN project_id SET NOT NULL;