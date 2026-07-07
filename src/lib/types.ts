export type Temperatura = 'FRIO' | 'MORNO' | 'QUENTE' | 'CLIENTE'

export type Canal =
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'EMAIL'
  | 'LIGACAO'
  | 'REUNIAO'
  | 'OUTRO'

export interface Interacao {
  id: string
  lead_id: string
  created_at: string
  data_conversa: string
  canal: Canal | null
  anotacao: string
}

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  temperatura: Temperatura
  // Fase 1 — lead
  nome_lead: string | null
  telefone: string | null
  instagram: string | null
  email: string | null
  cidade: string | null
  // Fase 2 — cliente fechado
  nome_completo: string | null
  cpf: string | null
  cnpj: string | null
  endereco: string | null
  // Contrato
  valor_contrato: number | null
  data_fechamento: string | null
  // Meta
  arquivado: boolean
  interacoes?: Interacao[]
}

export const TEMPERATURAS: {
  key: Temperatura
  label: string
  descricao: string
  cor: string
  bg: string
  borda: string
  emoji: string
}[] = [
  {
    key: 'FRIO',
    label: 'Frio',
    descricao: 'Primeiro contato',
    cor: '#5B9BD5',
    bg: 'rgba(91,155,213,0.08)',
    borda: 'rgba(91,155,213,0.30)',
    emoji: '❄️',
  },
  {
    key: 'MORNO',
    label: 'Morno',
    descricao: 'Nutrindo interesse',
    cor: '#E0A24B',
    bg: 'rgba(224,162,75,0.08)',
    borda: 'rgba(224,162,75,0.30)',
    emoji: '🌡️',
  },
  {
    key: 'QUENTE',
    label: 'Quente',
    descricao: 'Pronto para fechar',
    cor: '#E0603F',
    bg: 'rgba(224,96,63,0.08)',
    borda: 'rgba(224,96,63,0.30)',
    emoji: '🔥',
  },
  {
    key: 'CLIENTE',
    label: 'Cliente',
    descricao: 'Contrato fechado',
    cor: '#C9A245',
    bg: 'rgba(201,162,69,0.10)',
    borda: 'rgba(201,162,69,0.40)',
    emoji: '👑',
  },
]

export const CANAIS: { key: Canal; label: string; emoji: string }[] = [
  { key: 'WHATSAPP', label: 'WhatsApp', emoji: '💬' },
  { key: 'INSTAGRAM', label: 'Instagram', emoji: '📷' },
  { key: 'EMAIL', label: 'E-mail', emoji: '✉️' },
  { key: 'LIGACAO', label: 'Ligação', emoji: '📞' },
  { key: 'REUNIAO', label: 'Reunião', emoji: '🤝' },
  { key: 'OUTRO', label: 'Outro', emoji: '📌' },
]

export function formatBRL(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatBRLc(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'R$ 0'
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export function mesAno(d: string | null | undefined): string {
  if (!d) return '—'
  const [y, m] = d.split('T')[0].split('-')
  const mi = Number(m) - 1
  if (mi < 0 || mi > 11) return d
  return `${MESES[mi]}/${y}`
}

export function formatData(d: string | null | undefined): string {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  if (!y || !m || !day) return d
  return `${day}/${m}/${y}`
}
