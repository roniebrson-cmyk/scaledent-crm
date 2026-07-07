import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPerfil } from '@/lib/perfil'
import { createAdminClient } from '@/lib/supabase/admin'
import NovoUsuarioForm from '@/components/NovoUsuarioForm'
import UsuarioAcoes from '@/components/UsuarioAcoes'

export const dynamic = 'force-dynamic'

function formatData(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export default async function AdminPage() {
  const perfil = await getPerfil()
  if (!perfil) redirect('/login')
  if (perfil.role !== 'ADMIN') redirect('/')

  const semServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY

  let usuarios: {
    id: string
    email: string
    nome: string
    role: 'ADMIN' | 'VENDEDOR'
    created_at?: string
  }[] = []

  if (!semServiceKey) {
    const svc = createAdminClient()
    const { data } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 })
    usuarios = (data?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? '',
      nome: (u.user_metadata?.nome as string) ?? u.email ?? '',
      role: ((u.user_metadata?.role as string) === 'ADMIN' ? 'ADMIN' : 'VENDEDOR'),
      created_at: u.created_at,
    }))
  }

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{ background: 'rgba(10,10,11,0.82)', borderBottom: '1px solid var(--borda)' }}
      >
        <div className="max-w-[1100px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-scaledent.png" alt="ScaleDent" width={130} height={98} priority className="h-11 w-auto" />
            <div className="border-l pl-3" style={{ borderColor: 'var(--borda)' }}>
              <p className="font-display text-lg leading-none texto-dourado">Administração</p>
              <p className="text-[10px] tracking-wider" style={{ color: 'var(--texto-fraco)' }}>
                GESTÃO DE USUÁRIOS
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}
          >
            ← Voltar ao CRM
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 grid md:grid-cols-2 gap-6">
        {semServiceKey ? (
          <div className="painel p-6 md:col-span-2">
            <p className="font-display text-xl texto-dourado mb-2">Configuração pendente</p>
            <p className="text-sm" style={{ color: 'var(--texto-suave)' }}>
              Para criar usuários pelo painel, a chave{' '}
              <code className="px-1 rounded" style={{ background: 'var(--preto-2)', color: 'var(--dourado-claro)' }}>
                SUPABASE_SERVICE_ROLE_KEY
              </code>{' '}
              precisa estar no arquivo <code>.env.local</code> (e nas variáveis de ambiente da Vercel, ao publicar).
            </p>
          </div>
        ) : (
          <>
            <NovoUsuarioForm />

            <div className="painel p-5">
              <p className="font-display text-xl texto-dourado mb-4">
                Usuários ({usuarios.length})
              </p>
              <div className="space-y-2">
                {usuarios.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-xl p-3"
                    style={{ background: 'var(--painel-2)', border: '1px solid var(--borda)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--texto)' }}>
                        {u.nome}
                        <span
                          className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full align-middle"
                          style={
                            u.role === 'ADMIN'
                              ? { background: 'rgba(201,162,69,0.18)', color: 'var(--dourado-claro)' }
                              : { background: 'rgba(160,160,168,0.14)', color: 'var(--texto-suave)' }
                          }
                        >
                          {u.role === 'ADMIN' ? '👑 Admin' : '👤 Vendedor'}
                        </span>
                      </p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--texto-fraco)' }}>
                        {u.email} · desde {formatData(u.created_at)}
                      </p>
                    </div>
                    <UsuarioAcoes userId={u.id} role={u.role} ehVoce={u.id === perfil.id} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
