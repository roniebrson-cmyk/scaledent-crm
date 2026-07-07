'use server'

import { createClient } from '@/lib/supabase/server'

const CAMPOS = [
  'ativacoes',
  'conversas',
  'qualificados',
  'propostas_reuniao',
  'reunioes_agendadas',
  'reunioes_realizadas',
] as const

type Campo = (typeof CAMPOS)[number]

/**
 * Carrega as métricas do usuário logado no período informado.
 * Roda no servidor (sessão autenticada garantida).
 */
export async function carregarMetricas(inicio: string, fim: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('metricas')
    .select('*')
    .eq('owner_id', user.id)
    .gte('data', inicio)
    .lte('data', fim)

  return data ?? []
}

/**
 * Salva o valor de um indicador para uma data (upsert por owner_id + data).
 */
export async function salvarMetrica(data: string, campo: string, valor: number) {
  if (!CAMPOS.includes(campo as Campo)) return { erro: 'Campo inválido.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { erro: 'Data inválida.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erro: 'Sessão expirada.' }

  const v = Number.isFinite(valor) && valor >= 0 ? Math.round(valor) : 0

  const { error } = await supabase
    .from('metricas')
    .upsert(
      { owner_id: user.id, data, [campo]: v },
      { onConflict: 'owner_id,data' }
    )

  if (error) return { erro: error.message }
  return { ok: true }
}
