'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { alterarRole, excluirUsuario } from '@/app/admin/actions'

export default function UsuarioAcoes({
  userId,
  role,
  ehVoce,
}: {
  userId: string
  role: 'ADMIN' | 'VENDEDOR'
  ehVoce: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirma, setConfirma] = useState(false)

  if (ehVoce) {
    return (
      <span className="text-[11px]" style={{ color: 'var(--texto-fraco)' }}>
        você
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={() =>
          startTransition(async () => {
            await alterarRole(userId, role === 'ADMIN' ? 'VENDEDOR' : 'ADMIN')
            router.refresh()
          })
        }
        disabled={pending}
        className="text-[11px] px-2 py-1 rounded-md border transition-colors hover:opacity-80 disabled:opacity-50"
        style={{ borderColor: 'var(--borda)', color: 'var(--texto-suave)' }}
      >
        {role === 'ADMIN' ? '→ Vendedor' : '→ Admin'}
      </button>

      {!confirma ? (
        <button
          onClick={() => setConfirma(true)}
          className="text-[11px] px-2 py-1 rounded-md border transition-colors hover:opacity-80"
          style={{ borderColor: 'rgba(224,96,63,0.4)', color: '#E0603F' }}
        >
          Excluir
        </button>
      ) : (
        <button
          onClick={() =>
            startTransition(async () => {
              await excluirUsuario(userId)
              router.refresh()
            })
          }
          disabled={pending}
          className="text-[11px] px-2 py-1 rounded-md font-medium disabled:opacity-50"
          style={{ background: '#E0603F', color: '#0a0a0b' }}
        >
          Confirmar?
        </button>
      )}
    </div>
  )
}
