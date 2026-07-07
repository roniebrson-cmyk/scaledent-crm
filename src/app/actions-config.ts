'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Atualiza a meta de faturamento. Apenas ADMIN (garantido também pela RLS).
 */
export async function salvarMeta(valor: number, prazo: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { erro: 'Sessão expirada.' }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (perfil?.role !== 'ADMIN') return { erro: 'Apenas administradores podem alterar a meta.' }

  const v = Number.isFinite(valor) && valor > 0 ? valor : 0
  if (v <= 0) return { erro: 'Informe um valor de meta válido.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return { erro: 'Prazo inválido.' }

  const { error } = await supabase
    .from('configuracoes')
    .update({ meta_faturamento: v, meta_prazo: prazo })
    .eq('id', 1)

  if (error) return { erro: error.message }
  revalidatePath('/')
  return { ok: true }
}
