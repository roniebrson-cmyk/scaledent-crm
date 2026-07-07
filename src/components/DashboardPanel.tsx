'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'
import { carregarMetricas } from '@/app/actions-metricas'
import { TEMPERATURAS, formatBRL, type Lead } from '@/lib/types'

// ---------- helpers de data ----------
function ymdLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}
function mesAtual() {
  const h = new Date()
  return {
    inicio: ymdLocal(new Date(h.getFullYear(), h.getMonth(), 1)),
    fim: ymdLocal(new Date(h.getFullYear(), h.getMonth() + 1, 0)),
  }
}
function intervalo(inicio: string, fim: string) {
  const out: string[] = []
  const [y1, m1, d1] = inicio.split('-').map(Number)
  const [y2, m2, d2] = fim.split('-').map(Number)
  let cur = new Date(y1, m1 - 1, d1)
  const end = new Date(y2, m2 - 1, d2)
  let g = 0
  while (cur <= end && g < 400) {
    out.push(ymdLocal(cur))
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1)
    g++
  }
  return out
}
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

// ---------- estilos recharts ----------
const OURO = '#c9a245'
const OURO_CLARO = '#e4c078'
const tooltipStyle = {
  background: '#16161a',
  border: '1px solid rgba(201,162,69,0.34)',
  borderRadius: 10,
  color: '#ededf0',
  fontSize: 12,
}

type MetricaRow = {
  data: string
  ativacoes: number
  conversas: number
  qualificados: number
  propostas_reuniao: number
  reunioes_agendadas: number
  reunioes_realizadas: number
}

function Kpi({
  label,
  valor,
  sub,
  destaque,
}: {
  label: string
  valor: string
  sub?: string
  destaque?: boolean
}) {
  return (
    <div
      className="painel p-4"
      style={destaque ? { border: '1px solid var(--borda-forte)' } : undefined}
    >
      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--texto-fraco)' }}>
        {label}
      </p>
      <p
        className="font-display text-2xl md:text-3xl mt-1 leading-none"
        style={{ color: destaque ? OURO_CLARO : 'var(--texto)' }}
      >
        {valor}
      </p>
      {sub && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--texto-suave)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function Card({
  titulo,
  children,
  className = '',
}: {
  titulo: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`painel p-4 ${className}`}>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--texto)' }}>
        {titulo}
      </p>
      {children}
    </div>
  )
}

export default function DashboardPanel({ leads }: { leads: Lead[] }) {
  const inicial = useMemo(() => mesAtual(), [])
  const [inicio, setInicio] = useState(inicial.inicio)
  const [fim, setFim] = useState(inicial.fim)
  const [metricas, setMetricas] = useState<MetricaRow[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const data = (await carregarMetricas(inicio, fim)) as MetricaRow[]
    setMetricas(data ?? [])
    setCarregando(false)
  }, [inicio, fim])

  useEffect(() => {
    carregar()
  }, [carregar])

  // ---------- CRM ----------
  const porTemp = useMemo(() => {
    const m: Record<string, number> = { FRIO: 0, MORNO: 0, QUENTE: 0, CLIENTE: 0 }
    for (const l of leads) m[l.temperatura] = (m[l.temperatura] ?? 0) + 1
    return m
  }, [leads])

  const totalLeads = leads.length
  const clientes = porTemp.CLIENTE
  const receita = leads
    .filter((l) => l.temperatura === 'CLIENTE')
    .reduce((s, l) => s + (l.valor_contrato ?? 0), 0)
  const ticket = clientes > 0 ? receita / clientes : 0
  const conversao = totalLeads > 0 ? Math.round((clientes / totalLeads) * 100) : 0

  const pieData = TEMPERATURAS.map((t) => ({
    name: t.label,
    value: porTemp[t.key] ?? 0,
    cor: t.cor,
  })).filter((d) => d.value > 0)

  const cidades = useMemo(() => {
    const m: Record<string, number> = {}
    for (const l of leads) {
      const c = (l.cidade ?? '').trim()
      if (c) m[c] = (m[c] ?? 0) + 1
    }
    return Object.entries(m)
      .map(([cidade, qtd]) => ({ cidade, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 6)
  }, [leads])

  // ---------- Métricas do período ----------
  const totM = useMemo(() => {
    const t = {
      ativacoes: 0,
      conversas: 0,
      qualificados: 0,
      propostas_reuniao: 0,
      reunioes_agendadas: 0,
      reunioes_realizadas: 0,
    }
    for (const r of metricas) {
      t.ativacoes += r.ativacoes ?? 0
      t.conversas += r.conversas ?? 0
      t.qualificados += r.qualificados ?? 0
      t.propostas_reuniao += r.propostas_reuniao ?? 0
      t.reunioes_agendadas += r.reunioes_agendadas ?? 0
      t.reunioes_realizadas += r.reunioes_realizadas ?? 0
    }
    return t
  }, [metricas])

  const pct = (p: number, tot: number) => (tot > 0 ? Math.round((p / tot) * 100) : 0)

  const serie = useMemo(() => {
    const map: Record<string, MetricaRow> = {}
    for (const r of metricas) map[r.data] = r
    return intervalo(inicio, fim).map((dia) => {
      const r = map[dia]
      return {
        dia: ddmm(dia),
        Ativações: r?.ativacoes ?? 0,
        Conversas: r?.conversas ?? 0,
        Reuniões: r?.reunioes_realizadas ?? 0,
      }
    })
  }, [metricas, inicio, fim])

  function atalhoMes() {
    const m = mesAtual()
    setInicio(m.inicio)
    setFim(m.fim)
  }
  function atalhoAno() {
    const h = new Date()
    setInicio(ymdLocal(new Date(h.getFullYear(), 0, 1)))
    setFim(ymdLocal(new Date(h.getFullYear(), 11, 31)))
  }

  const totalReunioes = totM.reunioes_realizadas

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl texto-dourado">Dashboard</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--texto-suave)' }}>
            Visão consolidada do CRM e das métricas de vendas
          </p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="campo">De</label>
            <input type="date" value={inicio} max={fim} onChange={(e) => setInicio(e.target.value)} className="input-ouro" style={{ width: 'auto' }} />
          </div>
          <div>
            <label className="campo">Até</label>
            <input type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} className="input-ouro" style={{ width: 'auto' }} />
          </div>
          <button onClick={atalhoMes} className="text-xs px-3 py-2 rounded-lg border transition-colors hover:opacity-80" style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}>
            Mês
          </button>
          <button onClick={atalhoAno} className="text-xs px-3 py-2 rounded-lg border transition-colors hover:opacity-80" style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}>
            Ano
          </button>
        </div>
      </div>

      {/* KPIs do CRM */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <Kpi label="Total de Leads" valor={String(totalLeads)} sub={`${porTemp.QUENTE} quentes`} />
        <Kpi label="Clientes Fechados" valor={String(clientes)} destaque />
        <Kpi label="Taxa de Conversão" valor={`${conversao}%`} sub="leads → clientes" />
        <Kpi label="Receita Fechada" valor={formatBRL(receita)} destaque />
        <Kpi label="Ticket Médio" valor={formatBRL(ticket)} />
      </div>

      {/* Funil */}
      <div className="painel p-4 mb-4">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--texto)' }}>Funil de Leads</p>
        <div className="space-y-2">
          {TEMPERATURAS.map((t) => {
            const qtd = porTemp[t.key] ?? 0
            const largura = totalLeads > 0 ? Math.max((qtd / totalLeads) * 100, qtd > 0 ? 6 : 0) : 0
            return (
              <div key={t.key} className="flex items-center gap-3">
                <span className="text-xs w-20 shrink-0" style={{ color: 'var(--texto-suave)' }}>
                  {t.emoji} {t.label}
                </span>
                <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: 'var(--preto-2)' }}>
                  <div className="h-full flex items-center px-2 rounded-lg transition-all" style={{ width: `${largura}%`, background: `linear-gradient(90deg, ${t.cor}cc, ${t.cor}77)`, minWidth: qtd > 0 ? 28 : 0 }}>
                    <span className="text-xs font-bold" style={{ color: '#0a0a0b' }}>{qtd > 0 ? qtd : ''}</span>
                  </div>
                </div>
                <span className="text-xs w-10 text-right shrink-0" style={{ color: 'var(--texto-fraco)' }}>
                  {totalLeads > 0 ? Math.round((qtd / totalLeads) * 100) : 0}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gráficos CRM */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card titulo="Leads por Temperatura">
          {pieData.length === 0 ? (
            <p className="text-center text-xs py-12" style={{ color: 'var(--texto-fraco)' }}>Sem leads ainda.</p>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#a0a0a8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card titulo="Top Cidades">
          {cidades.length === 0 ? (
            <p className="text-center text-xs py-12" style={{ color: 'var(--texto-fraco)' }}>Sem cidades cadastradas.</p>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cidades} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fill: '#a0a0a8', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="cidade" width={90} tick={{ fill: '#a0a0a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(201,162,69,0.08)' }} />
                  <Bar dataKey="qtd" fill={OURO} radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Métricas do período */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Kpi label="Ativações" valor={String(totM.ativacoes)} />
        <Kpi label="Conversas" valor={String(totM.conversas)} sub={`${pct(totM.conversas, totM.ativacoes)}% resposta`} />
        <Kpi label="Qualificados" valor={String(totM.qualificados)} sub={`${pct(totM.qualificados, totM.conversas)}% qualif.`} />
        <Kpi label="Propostas" valor={String(totM.propostas_reuniao)} />
        <Kpi label="Reuniões Agend." valor={String(totM.reunioes_agendadas)} />
        <Kpi label="Comparecimento" valor={`${pct(totM.reunioes_realizadas, totM.reunioes_agendadas)}%`} sub={`${totalReunioes} realizadas`} destaque />
      </div>

      {/* Evolução */}
      <Card titulo="Evolução no Período">
        {serie.length === 0 ? (
          <p className="text-center text-xs py-12" style={{ color: 'var(--texto-fraco)' }}>Selecione um período.</p>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,69,0.10)" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: '#a0a0a8', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#a0a0a8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(201,162,69,0.3)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Ativações" stroke={OURO} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Conversas" stroke="#5B9BD5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Reuniões" stroke="#8BC34A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {carregando && (
          <p className="text-center text-[11px] mt-2" style={{ color: 'var(--texto-fraco)' }}>Atualizando…</p>
        )}
      </Card>
    </section>
  )
}
