'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { login } from './actions'

function Entrar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-ouro w-full py-2.5 text-sm disabled:opacity-60"
    >
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  )
}

export default function LoginPage() {
  const [erro, formAction] = useActionState(login, null)

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo-scaledent.png"
            alt="ScaleDent"
            width={220}
            height={165}
            priority
            className="w-48 h-auto"
          />
        </div>

        <div className="painel p-7">
          <h1 className="font-display text-2xl text-center mb-1 texto-dourado">
            Área Exclusiva
          </h1>
          <p className="text-center text-xs mb-6" style={{ color: 'var(--texto-suave)' }}>
            CRM da Mentoria Premium
          </p>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="campo" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-ouro"
                placeholder="voce@scaledent.com.br"
              />
            </div>
            <div>
              <label className="campo" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-ouro"
                placeholder="••••••••"
              />
            </div>

            {erro && (
              <p className="text-xs text-center" style={{ color: '#E0603F' }}>
                {erro}
              </p>
            )}

            <Entrar />
          </form>
        </div>

        <p
          className="text-center text-[11px] mt-6"
          style={{ color: 'var(--texto-fraco)' }}
        >
          ScaleDent · Escala · Liderança · Liberdade
        </p>
      </div>
    </main>
  )
}
