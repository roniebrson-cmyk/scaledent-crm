import { createClient } from '@/lib/supabase/server'

export type Role = 'ADMIN' | 'VENDEDOR'

export interface Perfil {
  id: string
  email: string
  nome: string | null
  role: Role
}

/** Retorna o perfil do usuário logado, ou null se não autenticado. */
export async function getPerfil(): Promise<Perfil | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email ?? '',
    nome: perfil?.nome ?? user.email ?? null,
    role: (perfil?.role as Role) ?? 'VENDEDOR',
  }
}
