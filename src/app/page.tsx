import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { TEMPERATURAS, formatBRL, type Lead } from '@/lib/types'
import KanbanBoard from '@/components/KanbanBoard'
import { sair } from './actions'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leads')
    .select('*, interacoes(*)')
    .eq('arquivado', false)
    .order('created_at', { ascending: false })

  const semTabela = error?.code === '42P01'
  const leads: Lead[] = (data ?? []).map((l) => ({
    ...l,
    interacoes: Array.isArray(l.interacoes)
      ? [...l.interacoes].sort((a, b) =>
          (b.data_conversa ?? '').localeCompare(a.data_conversa ?? '')
        )
      : [],
  }))

  const totalClientes = leads.filter((l) => l.temperatura === 'CLIENTE').length
  const receita = leads
    .filter((l) => l.temperatura === 'CLIENTE')
    .reduce((s, l) => s + (l.valor_contrato ?? 0), 0)

  return (
    <div className="min-h-screen">
      {/* Cabeçalho */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{
          background: 'rgba(10,10,11,0.82)',
          borderBottom: '1px solid var(--borda)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-scaledent.png"
              alt="ScaleDent"
              width={130}
              height={98}
              priority
              className="h-11 w-auto"
            />
            <div className="hidden sm:block border-l pl-3" style={{ borderColor: 'var(--borda)' }}>
              <p className="font-display text-lg leading-none texto-dourado">CRM</p>
              <p className="text-[10px] tracking-wider" style={{ color: 'var(--texto-fraco)' }}>
                MENTORIA PREMIUM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-5 text-right">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--texto-fraco)' }}>
                  Clientes
                </p>
                <p className="font-display text-lg texto-dourado leading-none">{totalClientes}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--texto-fraco)' }}>
                  Receita fechada
                </p>
                <p className="font-display text-lg texto-dourado leading-none">{formatBRL(receita)}</p>
              </div>
            </div>
            <form action={sair}>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {semTabela ? (
          <div className="painel p-8 max-w-xl mx-auto mt-10 text-center">
            <p className="font-display text-2xl texto-dourado mb-2">Quase lá!</p>
            <p className="text-sm mb-4" style={{ color: 'var(--texto-suave)' }}>
              O banco de dados ainda não foi configurado. Execute a migration{' '}
              <code
                className="px-1.5 py-0.5 rounded"
                style={{ background: 'var(--preto-2)', color: 'var(--dourado-claro)' }}
              >
                001_init.sql
              </code>{' '}
              no Supabase → SQL Editor.
            </p>
          </div>
        ) : (
          <KanbanBoard leadsIniciais={leads} temperaturas={TEMPERATURAS} />
        )}
      </main>
    </div>
  )
}
