# ScaleDent CRM

CRM da Mentoria Premium ScaleDent — funil de leads (Frio → Morno → Quente → Cliente),
histórico de conversas e dados de contrato.

## Stack
- Next.js 16 (App Router) + React 19
- Supabase (Postgres + Auth)
- Tailwind CSS 4

## Configuração

### 1. Banco de dados
No painel do Supabase → **SQL Editor**, execute o conteúdo de:
```
supabase/migrations/001_init.sql
```

### 2. Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Usuário de acesso
Supabase → **Authentication → Users → Add user** (e-mail + senha).
O login do CRM usa essas credenciais.

### 4. Rodar
```bash
npm install
npm run dev      # desenvolvimento — http://localhost:3000
npm run build && npm start   # produção
```

## Modelo de dados
- **leads** — funil, contato leve (telefone, instagram, email, cidade) e,
  ao fechar, dados completos (nome, CPF, CNPJ, endereço) + valor do contrato.
- **interacoes** — histórico de conversas (data, canal, anotação) por lead.
