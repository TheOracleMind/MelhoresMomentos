# Melhores Momentos

SaaS simples para criar uma página personalizada de melhores momentos, com Supabase Auth, Supabase Storage privado, Stripe Checkout sem webhook, dashboard, QR Code e página pública em `/p/[slug]`.

## Stack

- Next.js + TypeScript + Tailwind CSS
- Supabase Auth, PostgreSQL e Storage
- Stripe Checkout sem webhook
- Vercel

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Crie `.env.local` com base em `.env.example`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
```

3. No Supabase, rode o SQL de `supabase/schema.sql` no SQL Editor. Ele cria tabelas, índices, RLS e o bucket privado `gift-images`.

4. Configure Auth no Supabase:

- Habilite Email/Password.
- Habilite Magic Link, se quiser.
- Em URL Configuration, adicione `http://localhost:3000` em Site URL e Redirect URLs.

5. Rode o projeto:

```bash
npm run dev
```

6. Abra `http://localhost:3000`.

## Stripe Local

O projeto confirma o pagamento sem webhook. Depois do pagamento, a Stripe redireciona para:

```text
/checkout/success?session_id={CHECKOUT_SESSION_ID}
```

Essa página roda no servidor, consulta a sessão na Stripe, valida `payment_status=paid`, confere os metadados da conta e ativa ou renova a página.

O checkout usa `price_data` dinâmico, então não é obrigatório criar produtos ou prices no painel da Stripe para testar. Valores:

- R$19,90: página por 24 horas
- R$29,90: página por 365 dias
- R$9,90: renovação por 24 horas
- R$19,90: renovação por 365 dias

## Deploy Na Vercel

1. Crie o projeto na Vercel e conecte o repositório.
2. Configure as mesmas variáveis de ambiente do `.env.local`.
3. Defina `NEXT_PUBLIC_SITE_URL` com a URL final, por exemplo `https://seu-dominio.com`.
4. No Supabase Auth, adicione a URL da Vercel em Site URL e Redirect URLs.
5. Faça deploy.

## Segurança

- A service role do Supabase fica apenas no servidor.
- O bucket `gift-images` é privado.
- O banco usa RLS para limitar leitura e escrita ao dono da página.
- A página pública é renderizada no servidor e recebe URLs assinadas temporárias das imagens.
- O retorno do Checkout consulta a Stripe no servidor antes de ativar ou renovar páginas.
- Sem webhook, a ativação depende do retorno para `/checkout/success`. Para um MVP isso simplifica a operação; em escala, um webhook ainda pode ser adicionado como redundância.

## Estrutura Principal

- `app/`: rotas, páginas e APIs.
- `components/`: landing, fluxo, dashboard e página pública.
- `lib/`: Supabase, Stripe, planos, tipos e utilitários.
- `supabase/schema.sql`: comando SQL para criar banco, policies e storage.
