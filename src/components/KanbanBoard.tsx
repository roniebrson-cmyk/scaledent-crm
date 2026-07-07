'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Lead, Temperatura } from '@/lib/types'
import { moverLead } from '@/app/actions'
import LeadCard from './LeadCard'
import LeadDrawer from './LeadDrawer'
import NovoLeadModal from './NovoLeadModal'

type TempInfo = {
  key: Temperatura
  label: string
  descricao: string
  cor: string
  bg: string
  borda: string
  emoji: string
}

export default function KanbanBoard({
  leadsIniciais,
  temperaturas,
}: {
  leadsIniciais: Lead[]
  temperaturas: TempInfo[]
}) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais)
  const [ativoId, setAtivoId] = useState<string | null>(null)
  const [novoCol, setNovoCol] = useState<Temperatura | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<Temperatura | null>(null)
  const [, startTransition] = useTransition()

  // Sincroniza quando o servidor devolve dados novos.
  useEffect(() => setLeads(leadsIniciais), [leadsIniciais])

  const ativo = leads.find((l) => l.id === ativoId) ?? null

  function soltar(col: Temperatura) {
    const id = dragId
    setDragId(null)
    setOverCol(null)
    if (!id) return
    const lead = leads.find((l) => l.id === id)
    if (!lead || lead.temperatura === col) return
    // Otimista
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, temperatura: col } : l))
    )
    startTransition(async () => {
      await moverLead(id, col)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl texto-dourado">Funil de Vendas</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--texto-suave)' }}>
            {leads.length} contato{leads.length !== 1 ? 's' : ''} no funil · arraste os cartões entre as etapas
          </p>
        </div>
        <button onClick={() => setNovoCol('FRIO')} className="btn-ouro px-4 py-2.5 text-sm">
          + Novo Lead
        </button>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-4" style={{ minWidth: '980px' }}>
          {temperaturas.map((t) => {
            const cards = leads.filter((l) => l.temperatura === t.key)
            const emHover = overCol === t.key
            return (
              <section
                key={t.key}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (overCol !== t.key) setOverCol(t.key)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node))
                    setOverCol((c) => (c === t.key ? null : c))
                }}
                onDrop={() => soltar(t.key)}
                className="flex-1 min-w-[240px] rounded-2xl flex flex-col transition-colors"
                style={{
                  background: emHover ? t.bg : 'var(--painel)',
                  border: `1px solid ${emHover ? t.borda : 'var(--borda)'}`,
                  minHeight: 320,
                }}
              >
                {/* Cabeçalho da coluna */}
                <div
                  className="px-4 py-3 flex items-center justify-between border-b rounded-t-2xl"
                  style={{ borderColor: 'var(--borda)', background: t.bg }}
                >
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: t.cor }}>
                      <span>{t.emoji}</span> {t.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--texto-fraco)' }}>
                      {t.descricao}
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center"
                    style={{ background: t.borda, color: t.cor }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cartões */}
                <div className="p-2.5 space-y-2.5 flex-1">
                  {cards.length === 0 ? (
                    <button
                      onClick={() => setNovoCol(t.key)}
                      className="w-full text-center text-xs py-10 rounded-xl border border-dashed transition-colors hover:border-solid"
                      style={{ borderColor: 'var(--borda)', color: 'var(--texto-fraco)' }}
                    >
                      + Adicionar aqui
                    </button>
                  ) : (
                    cards.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        cor={t.cor}
                        arrastando={dragId === lead.id}
                        onDragStart={() => setDragId(lead.id)}
                        onDragEnd={() => {
                          setDragId(null)
                          setOverCol(null)
                        }}
                        onClick={() => setAtivoId(lead.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {ativo && (
        <LeadDrawer
          lead={ativo}
          temperaturas={temperaturas}
          onClose={() => setAtivoId(null)}
        />
      )}
      {novoCol && (
        <NovoLeadModal
          temperaturaInicial={novoCol}
          temperaturas={temperaturas}
          onClose={() => setNovoCol(null)}
        />
      )}
    </>
  )
}
