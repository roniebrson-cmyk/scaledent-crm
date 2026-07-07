'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/lib/perfil'

async function usuarioAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  return data?.role === 'ADMIN' ? user : null
}

// ------------------------------------------------------------
// Criar usuário (admin ou vendedor)
// ------------------------------------------------------------
export async function criarUsuario(formData: FormData) {
  const admin = await usuarioAdmin()
  if (!admin) return { erro: 'Acesso restrito a administradores.' }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      erro: 'Chave service_role não configurada no servidor (.env.local).',
    }
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const role = (String(formData.get('role') ?? 'VENDEDOR') as Role)

  if (!email || !password) return { erro: 'Informe e-mail e senha.' }
  if (password.length < 6) return { erro: 'A senha deve ter ao menos 6 caracteres.' }
  if (role !== 'ADMIN' && role !== 'VENDEDOR') return { erro: 'Perfil inválido.' }

  const svc = createAdminClient()
  const { error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome, role },
  })

  if (error) return { erro: error.message }
  revalidatePath('/admin')
  return { ok: true }
}

// ------------------------------------------------------------
// Alterar perfil (ADMIN <-> VENDEDOR)
// ------------------------------------------------------------
export async function alterarRole(userId: string, role: Role) {
  const admin = await usuarioAdmin()
  if (!admin) return { erro: 'Acesso restrito.' }
  if (admin.id === userId) return { erro: 'Você não pode alterar o próprio perfil.' }

  const svc = createAdminClient()
  const { error: e1 } = await svc.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  })
  const { error: e2 } = await svc
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (e1 || e2) return { erro: (e1 || e2)!.message }
  revalidatePath('/admin')
  return { ok: true }
}

// ------------------------------------------------------------
// Excluir usuário
// ------------------------------------------------------------
export async function excluirUsuario(userId: string) {
  const admin = await usuarioAdmin()
  if (!admin) return { erro: 'Acesso restrito.' }
  if (admin.id === userId) return { erro: 'Você não pode excluir a si mesmo.' }

  const svc = createAdminClient()
  const { error } = await svc.auth.admin.deleteUser(userId)
  if (error) return { erro: error.message }
  revalidatePath('/admin')
  return { ok: true }
}
