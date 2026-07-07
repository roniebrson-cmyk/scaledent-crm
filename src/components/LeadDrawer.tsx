'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Lead, Temperatura } from '@/lib/types'
import { CANAIS, formatData, formatBRL } from '@/lib/types'
import {
  atualizarLead,
  excluirLead,
  adicionarInteracao,
  excluirInteracao,
} from '@/app/actions'

type TempInfo = {
  key: Temperatura
  label: string
  cor: string
  emoji: string
}

type Aba = 'lead' | 'cliente' | 'historico'

export default function LeadDrawer({
  lead,
  temperaturas,
  onClose,
}: {
  lead: Lead
  temperaturas: TempInfo[]
  onClose: () => void
}) {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('lead')
  const [temp, setTemp] = useState<Temperatura>(lead.temperatura)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [pending, startTransition] = useTransition()
  const [confirmaExcluir, setConfirmaExcluir] = useState(false)

  const titulo =
    lead.nome_completo ||
    lead.nome_lead ||
    (lead.instagram ? `@${lead.instagram.replace(/^@/, '')}` : null) ||
    lead.telefone ||
    'Lead'

  const tempInfo = temperaturas.find((t) => t.key === temp)!

  function salvar(formData: FormData) {
    setErro(null)
    formData.set('temperatura', temp)
    startTransition(async () => {
      const r = await atualizarLead(lead.id, formData)
      if (r?.erro) return setErro(r.erro)
      setSalvo(true)
      router.refresh()
      setTimeout(() => setSalvo(false), 1800)
    })
  }

  function excluir() {
    startTransition(async () => {
      await excluirLead(lead.id)
      router.refresh()
      onClose()
    })
  }

  function novaInteracao(formData: FormData) {
    startTransition(async () => {
      const r = await adicionarInteracao(lead.id, formData)
      if (r?.erro) return setErro(r.erro)
      router.refresh()
      const form = document.getElementById('form-interacao') as HTMLFormElement | null
      form?.reset()
    })
  }

  const abas: { key: Aba; label: string }[] = [
    { key: 'lead', label: 'Dados do Lead' },
    { key: 'cliente', label: 'Cliente / Contrato' },
    { key: 'historico', label: `Histórico (${lead.interacoes?.length ?? 0})` },
  ]

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-lg overflow-y-auto flex flex-col"
        style={{ background: 'var(--preto-2)', borderLeft: '1px solid var(--borda-forte)' }}
      >
        {/* Cabeçalho */}
        <div
          className="sticky top-0 z-10 px-5 py-4 flex items-start justify-between gap-3 backdrop-blur-md"
          style={{ background: 'rgba(15,15,17,0.9)', borderBottom: '1px solid var(--borda)' }}
        >
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mb-1.5"
              style={{ background: `${tempInfo.cor}22`, color: tempInfo.cor }}
            >
              {tempInfo.emoji} {tempInfo.label}
            </span>
            <h2 className="font-display text-2xl leading-tight truncate" style={{ color: 'var(--texto)' }}>
              {titulo}
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--texto-fraco)' }}>
              Criado em {formatData(lead.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none px-2 py-1 rounded-lg hover:opacity-70"
            style={{ color: 'var(--texto-suave)' }}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 px-5 pt-3" style={{ borderBottom: '1px solid var(--borda)' }}>
          {abas.map((a) => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className="px-3 py-2 text-xs font-medium rounded-t-lg transition-colors"
              style={
                aba === a.key
                  ? { color: 'var(--dourado-claro)', borderBottom: '2px solid var(--dourado)' }
                  : { color: 'var(--texto-fraco)', borderBottom: '2px solid transparent' }
              }
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-5">
          {/* Temperatura — sempre visível */}
          {aba !== 'historico' && (
            <div className="mb-5">
              <label className="campo">Etapa do funil</label>
              <div className="flex gap-2 flex-wrap">
                {temperaturas.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setTemp(t.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={
                      temp === t.key
                        ? { background: t.cor, color: '#0a0a0b', borderColor: t.cor }
                        : { borderColor: 'var(--borda)', color: 'var(--texto-suave)' }
                    }
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulário de dados (Lead + Cliente compartilham o mesmo form) */}
          {aba !== 'historico' && (
            <form action={salvar} className="space-y-4" key={lead.id}>
              {/* ---- ABA LEAD ---- */}
              <div className={aba === 'lead' ? 'space-y-4' : 'hidden'}>
                <div>
                  <label className="campo">Nome / apelido</label>
                  <input name="nome_lead" defaultValue={lead.nome_lead ?? ''} className="input-ouro" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="campo">Telefone</label>
                    <input name="telefone" defaultValue={lead.telefone ?? ''} className="input-ouro" />
                  </div>
                  <div>
                    <label className="campo">Instagram</label>
                    <input name="instagram" defaultValue={lead.instagram ?? ''} className="input-ouro" placeholder="@usuario" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="campo">E-mail</label>
                    <input name="email" type="email" defaultValue={lead.email ?? ''} className="input-ouro" />
                  </div>
                  <div>
                    <label className="campo">Cidade</label>
                    <input name="cidade" defaultValue={lead.cidade ?? ''} className="input-ouro" />
                  </div>
                </div>
              </div>

              {/* ---- ABA CLIENTE / CONTRATO ---- */}
              <div className={aba === 'cliente' ? 'space-y-4' : 'hidden'}>
                <div
                  className="text-[11px] rounded-lg px-3 py-2 mb-1"
                  style={{ background: 'var(--painel)', color: 'var(--texto-suave)' }}
                >
                  Preencha ao fechar o contrato — dados para a prestação de serviço.
                </div>
                <div>
                  <label className="campo">Nome completo</label>
                  <input name="nome_completo" defaultValue={lead.nome_completo ?? ''} className="input-ouro" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="campo">CPF</label>
                    <input name="cpf" defaultValue={lead.cpf ?? ''} className="input-ouro" placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label className="campo">CNPJ (se tiver)</label>
                    <input name="cnpj" defaultValue={lead.cnpj ?? ''} className="input-ouro" placeholder="00.000.000/0000-00" />
                  </div>
                </div>
                <div>
                  <label className="campo">Endereço</label>
                  <input name="endereco" defaultValue={lead.endereco ?? ''} className="input-ouro" placeholder="Rua, nº, bairro, cidade/UF, CEP" />
                </div>
                <div
                  className="rounded-xl p-3.5"
                  style={{ background: 'var(--painel)', border: '1px solid var(--borda-forte)' }}
                >
                  <p className="font-display text-lg texto-dourado mb-3">Contrato Fechado</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="campo">Valor do contrato (R$)</label>
                      <input
                        name="valor_contrato"
                        defaultValue={
                          lead.valor_contrato != null
                            ? lead.valor_contrato.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })
                            : ''
                        }
                        className="input-ouro"
                        placeholder="0,00"
                        inputMode="decimal"
                      />
                    </div>
                    <div>
                      <label className="campo">Data de fechamento</label>
                      <input
                        name="data_fechamento"
                        type="date"
                        defaultValue={lead.data_fechamento ?? ''}
                        className="input-ouro"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {erro && (
                <p className="text-xs" style={{ color: '#E0603F' }}>
                  {erro}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button type="submit" disabled={pending} className="btn-ouro flex-1 py-2.5 text-sm disabled:opacity-60">
                  {pending ? 'Salvando…' : salvo ? '✓ Salvo' : 'Salvar alterações'}
                </button>
                {!confirmaExcluir ? (
                  <button
                    type="button"
                    onClick={() => setConfirmaExcluir(true)}
                    className="px-3 py-2.5 rounded-lg text-sm border transition-colors hover:opacity-80"
                    style={{ borderColor: 'rgba(224,96,63,0.4)', color: '#E0603F' }}
                  >
                    Excluir
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={excluir}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium"
                    style={{ background: '#E0603F', color: '#0a0a0b' }}
                  >
                    Confirmar?
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ---- ABA HISTÓRICO ---- */}
          {aba === 'historico' && (
            <div className="space-y-5">
              <form id="form-interacao" action={novaInteracao} className="painel p-4 space-y-3">
                <p className="font-medium text-sm" style={{ color: 'var(--texto)' }}>
                  Registrar conversa
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="campo">Data</label>
                    <input name="data_conversa" type="date" className="input-ouro" />
                  </div>
                  <div>
                    <label className="campo">Canal</label>
                    <select name="canal" className="input-ouro" defaultValue="">
                      <option value="">—</option>
                      {CANAIS.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.emoji} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="campo">O que foi falado</label>
                  <textarea
                    name="anotacao"
                    rows={3}
                    required
                    className="input-ouro resize-none"
                    placeholder="Resumo da conversa, combinados, objeções…"
                  />
                </div>
                <button type="submit" disabled={pending} className="btn-ouro w-full py-2 text-sm disabled:opacity-60">
                  {pending ? 'Registrando…' : '+ Adicionar ao histórico'}
                </button>
              </form>

              {/* Timeline */}
              <div className="space-y-3">
                {(lead.interacoes?.length ?? 0) === 0 ? (
                  <p className="text-center text-xs py-8" style={{ color: 'var(--texto-fraco)' }}>
                    Nenhuma conversa registrada ainda.
                  </p>
                ) : (
                  lead.interacoes!.map((it) => {
                    const canal = CANAIS.find((c) => c.key === it.canal)
                    return (
                      <div
                        key={it.id}
                        className="rounded-xl p-3.5 relative"
                        style={{ background: 'var(--painel)', border: '1px solid var(--borda)' }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium" style={{ color: 'var(--dourado-claro)' }}>
                            {formatData(it.data_conversa)}
                            {canal && (
                              <span style={{ color: 'var(--texto-suave)' }}>
                                {' '}
                                · {canal.emoji} {canal.label}
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await excluirInteracao(it.id)
                                router.refresh()
                              })
                            }
                            className="text-xs hover:opacity-70"
                            style={{ color: 'var(--texto-fraco)' }}
                            aria-label="Excluir anotação"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--texto)' }}>
                          {it.anotacao}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com resumo quando cliente */}
        {temp === 'CLIENTE' && lead.valor_contrato != null && aba !== 'historico' && (
          <div
            className="px-5 py-3 text-sm flex items-center justify-between"
            style={{ borderTop: '1px solid var(--borda)', background: 'var(--painel)' }}
          >
            <span style={{ color: 'var(--texto-suave)' }}>Contrato</span>
            <span className="font-display text-xl texto-dourado">
              {formatBRL(lead.valor_contrato)}
            </span>
          </div>
        )}
      </aside>
    </div>
  )
}
