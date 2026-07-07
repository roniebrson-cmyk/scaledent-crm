'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarUsuario } from '@/app/admin/actions'

export default function NovoUsuarioForm() {
  const router = useRouter()
  const [role, setRole] = useState<'ADMIN' | 'VENDEDOR'>('VENDEDOR')
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [pending, startTransition] = useTransition()

  function acao(formData: FormData) {
    setErro(null)
    setOk(false)
    formData.set('role', role)
    startTransition(async () => {
      const r = await criarUsuario(formData)
      if (r?.erro) return setErro(r.erro)
      setOk(true)
      router.refresh()
      const form = document.getElementById('form-usuario') as HTMLFormElement | null
      form?.reset()
      setTimeout(() => setOk(false), 2500)
    })
  }

  return (
    <form id="form-usuario" action={acao} className="painel p-5 space-y-4">
      <p className="font-display text-xl texto-dourado">Novo Usuário</p>

      <div>
        <label className="campo">Nome</label>
        <input name="nome" className="input-ouro" placeholder="Nome do usuário" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="campo">E-mail</label>
          <input name="email" type="email" required className="input-ouro" placeholder="email@exemplo.com" />
        </div>
        <div>
          <label className="campo">Senha inicial</label>
          <input name="password" type="text" required minLength={6} className="input-ouro" placeholder="mínimo 6 caracteres" />
        </div>
      </div>

      <div>
        <label className="campo">Perfil de acesso</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('VENDEDOR')}
            className="rounded-xl p-3 text-left border transition-colors"
            style={
              role === 'VENDEDOR'
                ? { borderColor: 'var(--dourado)', background: 'rgba(201,162,69,0.08)' }
                : { borderColor: 'var(--borda)' }
            }
          >
            <p className="text-sm font-medium" style={{ color: 'var(--texto)' }}>👤 Vendedor</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--texto-fraco)' }}>
              Usa o CRM e as métricas. Sem painel admin.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setRole('ADMIN')}
            className="rounded-xl p-3 text-left border transition-colors"
            style={
              role === 'ADMIN'
                ? { borderColor: 'var(--dourado)', background: 'rgba(201,162,69,0.08)' }
                : { borderColor: 'var(--borda)' }
            }
          >
            <p className="text-sm font-medium" style={{ color: 'var(--texto)' }}>👑 Administrador</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--texto-fraco)' }}>
              Acesso total, incluindo gestão de usuários.
            </p>
          </button>
        </div>
      </div>

      {erro && <p className="text-xs" style={{ color: '#E0603F' }}>{erro}</p>}
      {ok && <p className="text-xs" style={{ color: '#8BC34A' }}>✓ Usuário criado com sucesso.</p>}

      <button type="submit" disabled={pending} className="btn-ouro w-full py-2.5 text-sm disabled:opacity-60">
        {pending ? 'Criando…' : 'Criar usuário'}
      </button>
    </form>
  )
}
