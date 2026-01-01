-- Adiciona uma nova coluna temporária para a chave estrangeira
ALTER TABLE public.tasks ADD COLUMN project_id_temp UUID;

-- Atualiza a nova coluna com os IDs dos projetos existentes, se houver correspondência
-- Isso é um passo complexo e pode exigir lógica adicional se os nomes de projeto não forem únicos
-- Por simplicidade, vamos assumir que os nomes de projeto existentes em 'tasks' podem ser mapeados para novos projetos.
-- Para um cenário real, seria necessário um script de migração mais robusto.
-- Por enquanto, vamos deixar a coluna 'project_id_temp' nula e o usuário terá que reassociar.

-- Remove a coluna 'project' antiga
ALTER TABLE public.tasks DROP COLUMN project;

-- Renomeia a coluna temporária para 'project_id'
ALTER TABLE public.tasks RENAME COLUMN project_id_temp TO project_id;

-- Adiciona a restrição de chave estrangeira
ALTER TABLE public.tasks ADD CONSTRAINT fk_project
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Opcional: Se você quiser que 'project_id' seja NOT NULL, você precisaria garantir que todas as tarefas tenham um projeto associado.
-- ALTER TABLE public.tasks ALTER COLUMN project_id SET NOT NULL;