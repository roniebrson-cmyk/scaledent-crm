'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { salvarMetrica, carregarMetricas } from '@/app/actions-metricas'

type Row = {
  ativacoes: number
  conversas: number
  qualificados: number
  propostas_reuniao: number
  reunioes_agendadas: number
  reunioes_realizadas: number
}

const VAZIO: Row = {
  ativacoes: 0,
  conversas: 0,
  qualificados: 0,
  propostas_reuniao: 0,
  reunioes_agendadas: 0,
  reunioes_realizadas: 0,
}

type CampoNum = keyof Row

const pct = (parte: number, total: number): number | null =>
  total > 0 ? Math.round((parte / total) * 100) : null

const INDICADORES: {
  key: string
  label: string
  destaque?: boolean
  emoji?: string
  campo?: CampoNum
  calc?: (r: Row) => number | null
}[] = [
  { key: 'ativacoes', label: 'Ativações', campo: 'ativacoes', destaque: true, emoji: '⭐' },
  { key: 'conversas', label: 'Conversas', campo: 'conversas' },
  { key: 'taxa_resposta', label: 'Taxa de Resposta (%)', calc: (r) => pct(r.conversas, r.ativacoes), emoji: '🎯' },
  { key: 'qualificados', label: 'Qualificados', campo: 'qualificados', emoji: '😎' },
  { key: 'taxa_qualificacao', label: 'Taxa de Qualificação (%)', calc: (r) => pct(r.qualificados, r.conversas) },
  { key: 'propostas_reuniao', label: 'Proposta de Reunião', campo: 'propostas_reuniao' },
  { key: 'reunioes_agendadas', label: 'Reunião Agendada', campo: 'reunioes_agendadas', destaque: true, emoji: '⭐' },
  { key: 'reunioes_realizadas', label: 'Reunião Realizada', campo: 'reunioes_realizadas' },
  { key: 'taxa_comparecimento', label: 'Taxa de Comparecimento (%)', calc: (r) => pct(r.reunioes_realizadas, r.reunioes_agendadas), destaque: true, emoji: '✅' },
]

function ymdLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

function semanaAtual() {
  const hoje = new Date()
  const dow = (hoje.getDay() + 6) % 7 // 0 = segunda
  const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dow)
  const dom = new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + 6)
  return { inicio: ymdLocal(seg), fim: ymdLocal(dom) }
}

function intervalo(inicio: string, fim: string) {
  const out: string[] = []
  const [y1, m1, d1] = inicio.split('-').map(Number)
  const [y2, m2, d2] = fim.split('-').map(Number)
  let cur = new Date(y1, m1 - 1, d1)
  const end = new Date(y2, m2 - 1, d2)
  let guard = 0
  while (cur <= end && guard < 400) {
    out.push(ymdLocal(cur))
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1)
    guard++
  }
  return out
}

function rotuloDia(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const wd = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  return {
    wd: wd.charAt(0).toUpperCase() + wd.slice(1),
    dm: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
  }
}

function CelulaNum({
  valor,
  onSalvar,
}: {
  valor: number
  onSalvar: (v: number) => void
}) {
  const [txt, setTxt] = useState(valor ? String(valor) : '')
  useEffect(() => setTxt(valor ? String(valor) : ''), [valor])

  return (
    <input
      type="number"
      min={0}
      value={txt}
      onChange={(e) => setTxt(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        const v = txt === '' ? 0 : Math.max(0, Math.round(Number(txt)))
        if (v !== valor) onSalvar(v)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className="w-full bg-transparent text-center text-sm outline-none py-2 focus:bg-[rgba(201,162,69,0.08)] rounded"
      style={{ color: 'var(--texto)' }}
    />
  )
}

export default function MetricasPanel() {
  const inicial = useMemo(() => semanaAtual(), [])
  const [inicio, setInicio] = useState(inicial.inicio)
  const [fim, setFim] = useState(inicial.fim)
  const [dados, setDados] = useState<Record<string, Row>>({})
  const [carregando, setCarregando] = useState(true)

  const dias = useMemo(() => intervalo(inicio, fim), [inicio, fim])

  const carregar = useCallback(async () => {
    setCarregando(true)
    const data = await carregarMetricas(inicio, fim)
    const map: Record<string, Row> = {}
    for (const r of data ?? []) {
      map[r.data] = {
        ativacoes: r.ativacoes ?? 0,
        conversas: r.conversas ?? 0,
        qualificados: r.qualificados ?? 0,
        propostas_reuniao: r.propostas_reuniao ?? 0,
        reunioes_agendadas: r.reunioes_agendadas ?? 0,
        reunioes_realizadas: r.reunioes_realizadas ?? 0,
      }
    }
    setDados(map)
    setCarregando(false)
  }, [inicio, fim])

  useEffect(() => {
    carregar()
  }, [carregar])

  function linha(dia: string): Row {
    return dados[dia] ?? VAZIO
  }

  async function editar(dia: string, campo: CampoNum, valor: number) {
    setDados((prev) => ({
      ...prev,
      [dia]: { ...(prev[dia] ?? VAZIO), [campo]: valor },
    }))
    await salvarMetrica(dia, campo, valor)
  }

  // Totais do período
  const total: Row = useMemo(() => {
    const t = { ...VAZIO }
    for (const dia of dias) {
      const r = linha(dia)
      t.ativacoes += r.ativacoes
      t.conversas += r.conversas
      t.qualificados += r.qualificados
      t.propostas_reuniao += r.propostas_reuniao
      t.reunioes_agendadas += r.reunioes_agendadas
      t.reunioes_realizadas += r.reunioes_realizadas
    }
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, dias])

  function atalhoSemana() {
    const s = semanaAtual()
    setInicio(s.inicio)
    setFim(s.fim)
  }
  function atalhoMes() {
    const h = new Date()
    setInicio(ymdLocal(new Date(h.getFullYear(), h.getMonth(), 1)))
    setFim(ymdLocal(new Date(h.getFullYear(), h.getMonth() + 1, 0)))
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl texto-dourado">Métricas de Vendas</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--texto-suave)' }}>
            Acompanhamento diário · percentuais calculados automaticamente
          </p>
        </div>

        {/* Seletor de período */}
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="campo">De</label>
            <input
              type="date"
              value={inicio}
              max={fim}
              onChange={(e) => setInicio(e.target.value)}
              className="input-ouro"
              style={{ width: 'auto' }}
            />
          </div>
          <div>
            <label className="campo">Até</label>
            <input
              type="date"
              value={fim}
              min={inicio}
              onChange={(e) => setFim(e.target.value)}
              className="input-ouro"
              style={{ width: 'auto' }}
            />
          </div>
          <button
            onClick={atalhoSemana}
            className="text-xs px-3 py-2 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}
          >
            Semana
          </button>
          <button
            onClick={atalhoMes}
            className="text-xs px-3 py-2 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}
          >
            Mês
          </button>
        </div>
      </div>

      <div className="painel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--borda)' }}>
                <th
                  className="text-left text-xs font-semibold px-4 py-3 sticky left-0 z-10"
                  style={{ color: 'var(--texto-suave)', background: 'var(--painel)', minWidth: 200 }}
                >
                  Indicador
                </th>
                {dias.map((d) => {
                  const r = rotuloDia(d)
                  return (
                    <th key={d} className="px-2 py-2 text-center" style={{ minWidth: 68 }}>
                      <div className="text-[11px] font-semibold" style={{ color: 'var(--dourado-claro)' }}>
                        {r.wd}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--texto-fraco)' }}>
                        {r.dm}
                      </div>
                    </th>
                  )
                })}
                <th
                  className="px-3 py-2 text-center text-[11px] font-bold"
                  style={{ color: 'var(--dourado)', minWidth: 74, borderLeft: '1px solid var(--borda)' }}
                >
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {INDICADORES.map((ind) => {
                const ehPct = !!ind.calc
                return (
                  <tr
                    key={ind.key}
                    style={{
                      borderBottom: '1px solid var(--borda)',
                      background: ind.destaque ? 'rgba(201,162,69,0.05)' : 'transparent',
                    }}
                  >
                    <td
                      className="px-4 py-1.5 text-sm sticky left-0 z-10"
                      style={{
                        color: ehPct ? 'var(--texto-suave)' : 'var(--texto)',
                        background: ind.destaque ? '#191712' : 'var(--painel)',
                        fontWeight: ind.destaque || ehPct ? 600 : 400,
                      }}
                    >
                      <span className="mr-1">{ind.emoji}</span>
                      {ind.label}
                    </td>

                    {dias.map((dia) => {
                      const r = linha(dia)
                      if (ehPct) {
                        const v = ind.calc!(r)
                        return (
                          <td key={dia} className="text-center text-sm" style={{ color: 'var(--texto-suave)' }}>
                            {v === null ? '—' : `${v}%`}
                          </td>
                        )
                      }
                      return (
                        <td key={dia} className="p-0" style={{ borderLeft: '1px solid rgba(201,162,69,0.06)' }}>
                          <CelulaNum
                            valor={r[ind.campo!]}
                            onSalvar={(val) => editar(dia, ind.campo!, val)}
                          />
                        </td>
                      )
                    })}

                    {/* Total */}
                    <td
                      className="text-center text-sm font-bold"
                      style={{ color: 'var(--dourado-claro)', borderLeft: '1px solid var(--borda)' }}
                    >
                      {ehPct
                        ? (() => {
                            const v = ind.calc!(total)
                            return v === null ? '—' : `${v}%`
                          })()
                        : total[ind.campo!]}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {carregando && (
          <p className="text-center text-xs py-3" style={{ color: 'var(--texto-fraco)' }}>
            Carregando…
          </p>
        )}
      </div>
      <p className="text-[11px] mt-2" style={{ color: 'var(--texto-fraco)' }}>
        Digite os números nas células (Ativações, Conversas, Qualificados, Propostas, Reuniões). As taxas em % são calculadas sozinhas. Cada vendedor vê e edita apenas os próprios números.
      </p>
    </section>
  )
}
