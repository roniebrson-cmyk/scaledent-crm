-- ============================================================
-- ScaleDent CRM — Configurações globais (meta de faturamento)
-- Execute no Supabase → SQL Editor DEPOIS do 002_roles_metricas.sql
-- ============================================================

-- Função utilitária: o usuário logado é ADMIN?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- Tabela de configuração — linha única (id = 1)
create table if not exists public.configuracoes (
  id               int primary key default 1,
  meta_faturamento numeric(14,2) not null default 1500000,
  meta_prazo       date not null default '2026-12-31',
  updated_at       timestamptz not null default now(),
  constraint config_singleton check (id = 1)
);

insert into public.configuracoes (id) values (1)
on conflict (id) do nothing;

alter table public.configuracoes enable row level security;

-- Todos autenticados leem; apenas ADMIN altera.
drop policy if exists "config_read" on public.configuracoes;
create policy "config_read" on public.configuracoes
  for select to authenticated using (true);

drop policy if exists "config_admin_update" on public.configuracoes;
create policy "config_admin_update" on public.configuracoes
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_config_updated_at on public.configuracoes;
create trigger trg_config_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();
