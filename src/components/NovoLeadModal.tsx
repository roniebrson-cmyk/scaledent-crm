'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Temperatura } from '@/lib/types'
import { criarLead } from '@/app/actions'

type TempInfo = { key: Temperatura; label: string; emoji: string; cor: string }

export default function NovoLeadModal({
  temperaturaInicial,
  temperaturas,
  onClose,
}: {
  temperaturaInicial: Temperatura
  temperaturas: TempInfo[]
  onClose: () => void
}) {
  const router = useRouter()
  const [temp, setTemp] = useState<Temperatura>(temperaturaInicial)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function acao(formData: FormData) {
    formData.set('temperatura', temp)
    startTransition(async () => {
      const r = await criarLead(formData)
      if (r?.erro) return setErro(r.erro)
      router.refresh()
      onClose()
    })
  }

  return (
    <Overlay onClose={onClose}>
      <div className="painel w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl texto-dourado mb-1">Novo Lead</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--texto-suave)' }}>
          Preencha todos os campos para cadastrar o lead.
        </p>

        <form action={acao} className="space-y-4">
          <div>
            <label className="campo">Temperatura</label>
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

          <div>
            <label className="campo">Nome / apelido</label>
            <input name="nome_lead" required className="input-ouro" placeholder="Como você reconhece este lead" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="campo">Telefone</label>
              <input name="telefone" required className="input-ouro" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="campo">Instagram</label>
              <input name="instagram" required className="input-ouro" placeholder="@usuario" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="campo">E-mail</label>
              <input name="email" type="email" required className="input-ouro" placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="campo">Cidade</label>
              <input name="cidade" required className="input-ouro" placeholder="Cidade / UF" />
            </div>
          </div>

          {erro && (
            <p className="text-xs" style={{ color: '#E0603F' }}>
              {erro}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm border transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}
            >
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="btn-ouro flex-1 py-2.5 text-sm disabled:opacity-60">
              {pending ? 'Salvando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  )
}

export function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }}
    >
      {children}
    </div>
  )
}
