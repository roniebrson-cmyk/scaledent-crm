'use client'

import type { Lead } from '@/lib/types'
import { formatBRL } from '@/lib/types'

export default function LeadCard({
  lead,
  cor,
  arrastando,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  lead: Lead
  cor: string
  arrastando: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onClick: () => void
}) {
  const titulo =
    lead.nome_completo ||
    lead.nome_lead ||
    (lead.instagram ? `@${lead.instagram.replace(/^@/, '')}` : null) ||
    lead.telefone ||
    lead.email ||
    'Sem identificação'

  const qtdInteracoes = lead.interacoes?.length ?? 0
  const ultima = lead.interacoes?.[0]

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="rounded-xl p-3 cursor-pointer select-none transition-all hover:-translate-y-0.5"
      style={{
        background: 'var(--painel-2)',
        border: '1px solid var(--borda)',
        borderLeft: `3px solid ${cor}`,
        opacity: arrastando ? 0.4 : 1,
      }}
    >
      <p className="font-medium text-sm leading-tight" style={{ color: 'var(--texto)' }}>
        {titulo}
      </p>

      <div className="mt-1.5 flex flex-col gap-0.5 text-[11px]" style={{ color: 'var(--texto-suave)' }}>
        {lead.cidade && <span>📍 {lead.cidade}</span>}
        {lead.instagram && lead.instagram !== titulo && (
          <span>📷 @{lead.instagram.replace(/^@/, '')}</span>
        )}
        {lead.telefone && lead.telefone !== titulo && <span>📞 {lead.telefone}</span>}
      </div>

      {lead.temperatura === 'CLIENTE' && lead.valor_contrato != null && (
        <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--dourado-claro)' }}>
          {formatBRL(lead.valor_contrato)}
        </p>
      )}

      {(qtdInteracoes > 0 || ultima) && (
        <div
          className="mt-2 pt-2 flex items-center gap-2 text-[10px]"
          style={{ borderTop: '1px solid var(--borda)', color: 'var(--texto-fraco)' }}
        >
          <span>💬 {qtdInteracoes}</span>
          {ultima && (
            <span className="truncate flex-1">
              {ultima.anotacao.length > 40
                ? ultima.anotacao.slice(0, 40) + '…'
                : ultima.anotacao}
            </span>
          )}
        </div>
      )}
    </article>
  )
}
