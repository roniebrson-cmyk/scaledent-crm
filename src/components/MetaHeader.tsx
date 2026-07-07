'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRLc, mesAno } from '@/lib/types'
import { salvarMeta } from '@/app/actions-config'

export default function MetaHeader({
  meta,
  prazo,
  receita,
  isAdmin,
}: {
  meta: number
  prazo: string
  receita: number
  isAdmin: boolean
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(String(meta))
  const [dataPrazo, setDataPrazo] = useState(prazo)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const progresso = meta > 0 ? Math.min((receita / meta) * 100, 100) : 0
  const pctReal = meta > 0 ? Math.round((receita / meta) * 100) : 0
  const falta = Math.max(meta - receita, 0)

  function salvar() {
    setErro(null)
    const v = Number(String(valor).replace(/\./g, '').replace(',', '.'))
    startTransition(async () => {
      const r = await salvarMeta(v, dataPrazo)
      if (r?.erro) return setErro(r.erro)
      setEditando(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-w-0 px-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: 'var(--texto-fraco)' }}>
            Meta de Faturamento · {mesAno(prazo)}
          </span>
          {isAdmin && (
            <button
              onClick={() => {
                setValor(String(meta))
                setDataPrazo(prazo)
                setEditando(true)
              }}
              className="text-[10px] leading-none opacity-60 hover:opacity-100 transition-opacity"
              title="Editar meta"
              aria-label="Editar meta"
            >
              ✏️
            </button>
          )}
        </div>
        <p className="font-display text-lg md:text-xl leading-none texto-dourado">
          {formatBRLc(meta)}
        </p>
        <div className="w-full max-w-[240px] mt-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--preto-2)' }}>
            <div
              className="h-full dourado-grad transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-[9px] text-center mt-0.5" style={{ color: 'var(--texto-suave)' }}>
            {formatBRLc(receita)} · {pctReal}%
          </p>
        </div>
      </div>

      {editando && (
        <div
          onClick={() => setEditando(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }}
        >
          <div className="painel w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl texto-dourado mb-1">Meta de Faturamento</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--texto-suave)' }}>
              Faltam {formatBRLc(falta)} para atingir a meta atual.
            </p>

            <div className="space-y-4">
              <div>
                <label className="campo">Valor da meta (R$)</label>
                <input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  inputMode="decimal"
                  className="input-ouro"
                  placeholder="1500000"
                />
              </div>
              <div>
                <label className="campo">Prazo</label>
                <input
                  type="date"
                  value={dataPrazo}
                  onChange={(e) => setDataPrazo(e.target.value)}
                  className="input-ouro"
                />
              </div>

              {erro && <p className="text-xs" style={{ color: '#E0603F' }}>{erro}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditando(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm border transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}
                >
                  Cancelar
                </button>
                <button onClick={salvar} disabled={pending} className="btn-ouro flex-1 py-2.5 text-sm disabled:opacity-60">
                  {pending ? 'Salvando…' : 'Salvar meta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
