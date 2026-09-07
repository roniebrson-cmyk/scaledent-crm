-- ============================================================
-- ScaleDent CRM — Nova etapa do funil: "1º Contato" (CONTATO)
-- Adiciona o valor 'CONTATO' antes de 'FRIO' na coluna temperatura.
-- Execute no Supabase → SQL Editor
-- ============================================================

alter table public.leads
  drop constraint if exists leads_temperatura_check;

alter table public.leads
  add constraint leads_temperatura_check
  check (temperatura in ('CONTATO','FRIO','MORNO','QUENTE','CLIENTE'));

-- Novos leads passam a entrar em "1º Contato" por padrão
alter table public.leads
  alter column temperatura set default 'CONTATO';
