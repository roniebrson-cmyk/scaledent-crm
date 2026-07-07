'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Temperatura, Canal } from '@/lib/types'

function limpar(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

// ------------------------------------------------------------
// Criar lead (cadastro leve — Fase 1)
// ------------------------------------------------------------
export async function criarLead(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('leads').insert({
    temperatura: (limpar(formData.get('temperatura')) as Temperatura) ?? 'FRIO',
    nome_lead: limpar(formData.get('nome_lead')),
    telefone: limpar(formData.get('telefone')),
    instagram: limpar(formData.get('instagram')),
    email: limpar(formData.get('email')),
    cidade: limpar(formData.get('cidade')),
  })

  if (error) return { erro: error.message }
  revalidatePath('/')
  return { ok: true }
}

// ------------------------------------------------------------
// Mover lead entre colunas (mudar temperatura)
// ------------------------------------------------------------
export async function moverLead(id: string, temperatura: Temperatura) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('leads')
    .update({ temperatura })
    .eq('id', id)

  if (error) return { erro: error.message }
  revalidatePath('/')
  return { ok: true }
}

// ------------------------------------------------------------
// Atualizar lead (dados completos + contrato — Fase 2)
// ------------------------------------------------------------
export async function atualizarLead(id: string, formData: FormData) {
  const supabase = await createClient()

  const valorStr = limpar(formData.get('valor_contrato'))
  const valor = valorStr
    ? Number(valorStr.replace(/\./g, '').replace(',', '.'))
    : null

  const { error } = await supabase
    .from('leads')
    .update({
      temperatura: (limpar(formData.get('temperatura')) as Temperatura) ?? 'FRIO',
      nome_lead: limpar(formData.get('nome_lead')),
      telefone: limpar(formData.get('telefone')),
      instagram: limpar(formData.get('instagram')),
      email: limpar(formData.get('email')),
      cidade: limpar(formData.get('cidade')),
      nome_completo: limpar(formData.get('nome_completo')),
      cpf: limpar(formData.get('cpf')),
      cnpj: limpar(formData.get('cnpj')),
      endereco: limpar(formData.get('endereco')),
      valor_contrato: valor !== null && !Number.isNaN(valor) ? valor : null,
      data_fechamento: limpar(formData.get('data_fechamento')),
    })
    .eq('id', id)

  if (error) return { erro: error.message }
  revalidatePath('/')
  return { ok: true }
}

// ------------------------------------------------------------
// Excluir lead
// ------------------------------------------------------------
export async function excluirLead(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/')
  return { ok: true }
}

// ------------------------------------------------------------
// Adicionar interação (histórico de conversa)
// ------------------------------------------------------------
export async function adicionarInteracao(leadId: string, formData: FormData) {
  const supabase = await createClient()

  const anotacao = limpar(formData.get('anotacao'))
  if (!anotacao) return { erro: 'A anotação não pode ficar vazia.' }

  const { error } = await supabase.from('interacoes').insert({
    lead_id: leadId,
    anotacao,
    data_conversa: limpar(formData.get('data_conversa')) ?? undefined,
    canal: (limpar(formData.get('canal')) as Canal) ?? null,
  })

  if (error) return { erro: error.message }
  revalidatePath('/')
  return { ok: true }
}

// ------------------------------------------------------------
// Excluir interação
// ------------------------------------------------------------
export async function excluirInteracao(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('interacoes').delete().eq('id', id)
  if (error) return { erro: error.message }
  revalidatePath('/')
  return { ok: true }
}

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------
export async function sair() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
