-- ============================================================
-- ScaleDent CRM — Schema inicial
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Extensão para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabela: leads
-- ------------------------------------------------------------
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Classificação do funil
  temperatura    text not null default 'FRIO'
                 check (temperatura in ('FRIO','MORNO','QUENTE','CLIENTE')),

  -- Fase 1 — cadastro leve do lead
  nome_lead      text,
  telefone       text,
  instagram      text,
  email          text,
  cidade         text,

  -- Fase 2 — cadastro completo (ao fechar contrato)
  nome_completo  text,
  cpf            text,
  cnpj           text,
  endereco       text,

  -- Contrato
  valor_contrato numeric(12,2),
  data_fechamento date,

  -- Meta
  arquivado      boolean not null default false
);

create index if not exists idx_leads_temperatura on public.leads (temperatura);
create index if not exists idx_leads_arquivado on public.leads (arquivado);

-- ------------------------------------------------------------
-- Tabela: interacoes (histórico de conversas)
-- ------------------------------------------------------------
create table if not exists public.interacoes (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  created_at    timestamptz not null default now(),
  data_conversa date not null default current_date,
  canal         text check (canal in
                  ('WHATSAPP','INSTAGRAM','EMAIL','LIGACAO','REUNIAO','OUTRO')),
  anotacao      text not null
);

create index if not exists idx_interacoes_lead on public.interacoes (lead_id, data_conversa desc);

-- ------------------------------------------------------------
-- Trigger: manter updated_at do lead
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- Workspace único: qualquer usuário autenticado tem acesso total.
-- ------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.interacoes enable row level security;

drop policy if exists "leads_auth_all" on public.leads;
create policy "leads_auth_all" on public.leads
  for all to authenticated using (true) with check (true);

drop policy if exists "interacoes_auth_all" on public.interacoes;
create policy "interacoes_auth_all" on public.interacoes
  for all to authenticated using (true) with check (true);
