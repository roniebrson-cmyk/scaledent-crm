-- ============================================================
-- ScaleDent CRM — Perfis de usuário (roles) + Métricas de vendas
-- Execute no Supabase → SQL Editor DEPOIS do 001_init.sql
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: profiles (perfil e nível de acesso de cada usuário)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  role       text not null default 'VENDEDOR'
             check (role in ('ADMIN','VENDEDOR')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update to authenticated using (id = auth.uid());

-- Cria o profile automaticamente quando um usuário novo é criado no Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'VENDEDOR')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Garante profile para usuários que JÁ existem e promove o(s) atual(is) a ADMIN
-- (o primeiro cadastro, feito por você, vira administrador).
insert into public.profiles (id, nome, role)
select id, coalesce(raw_user_meta_data->>'nome', email), 'ADMIN'
from auth.users
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Tabela: metricas (acompanhamento diário de vendas, por usuário)
-- ------------------------------------------------------------
create table if not exists public.metricas (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid()
                      references auth.users(id) on delete cascade,
  data                date not null,
  ativacoes           int not null default 0,
  conversas           int not null default 0,
  qualificados        int not null default 0,
  propostas_reuniao   int not null default 0,
  reunioes_agendadas  int not null default 0,
  reunioes_realizadas int not null default 0,
  updated_at          timestamptz not null default now(),
  unique (owner_id, data)
);

create index if not exists idx_metricas_owner_data on public.metricas (owner_id, data);

alter table public.metricas enable row level security;

-- Cada usuário enxerga e edita apenas as próprias métricas.
drop policy if exists "metricas_own" on public.metricas;
create policy "metricas_own" on public.metricas
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop trigger if exists trg_metricas_updated_at on public.metricas;
create trigger trg_metricas_updated_at
  before update on public.metricas
  for each row execute function public.set_updated_at();
