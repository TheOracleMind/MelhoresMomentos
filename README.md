# Melhores Momentos

SaaS simples para criar uma página personalizada de melhores momentos, com Supabase Auth, Supabase Storage privado, Stripe Checkout sem webhook, dashboard, painel administrativo, QR Code e página pública em `/p/[slug]`.

## Stack

- Next.js + TypeScript + Tailwind CSS
- Supabase Auth, PostgreSQL e Storage
- Stripe Checkout sem webhook
- Vercel

## Fluxo Atual

1. A pessoa clica em `Criar Minha Página`.
2. O wizard abre imediatamente, sem pedir login.
3. O rascunho fica salvo no navegador e as imagens sobem para o bucket privado por uma API server-side.
4. No último passo, a pessoa seleciona um plano.
5. O Stripe coleta o email no checkout.
6. Depois do pagamento, `/checkout/success` confirma a sessão na Stripe.
7. A pessoa cria uma senha e a página paga é vinculada à conta.

## Configuração Local

1. Instale dependências:

```bash
npm install
```

2. Crie `.env.local` com base em `.env.example`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_META_PIXEL_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
```

3. No Supabase, rode o SQL de `supabase/schema.sql` no SQL Editor. Ele cria tabelas, índices, RLS e o bucket privado `gift-images`.

Se o banco já existir e você não quiser apagar tudo, rode `supabase/admin_update.sql` para adicionar apenas as tabelas do admin e analytics.

4. Configure Auth no Supabase:

- Habilite Email/Password.
- Habilite Magic Link, se quiser.
- Em URL Configuration, adicione `http://localhost:3000` em Site URL e Redirect URLs.

5. Rode o projeto:

```bash
npm run dev
```

6. Abra `http://localhost:3000`.

## Primeiro Acesso Admin

1. Com o schema aplicado, abra `/admin`.
2. Se ainda não existir administrador, a página vai pedir email e senha para criar a única conta admin.
3. Depois disso, `/admin` passa a exigir login. Nenhum outro administrador poderá ser criado pela interface.
4. A conta admin também usa o dashboard normal e pode criar páginas em `/create` sem passar pelo checkout.

## Stripe Local

O projeto confirma o pagamento sem webhook. Depois do pagamento, a Stripe redireciona para:

```text
/checkout/success?session_id={CHECKOUT_SESSION_ID}
```

Essa página roda no servidor, consulta a sessão na Stripe, valida `payment_status=paid`, confere os metadados e ativa ou renova a página.

O checkout usa `price_data` dinâmico, então não é obrigatório criar produtos ou prices no painel da Stripe para testar. Valores:

- R$19,90: página por 24 horas
- R$29,90: página por 30 dias
- R$9,90: renovação por 24 horas
- R$19,90: renovação por 30 dias

## Meta Pixel

Configure `NEXT_PUBLIC_META_PIXEL_ID` com o ID do Pixel da Meta.

Eventos enviados:

- `PageView`: quando a pessoa entra na página de vendas.
- `Purchase`: depois que `/checkout/success` confirma o pagamento na Stripe, com `value`, `currency`, `content_ids`, `content_type` e `content_name`.

## Deploy Na Vercel

1. Crie o projeto na Vercel e conecte o repositório.
2. Configure as mesmas variáveis de ambiente do `.env.local`.
3. Defina `NEXT_PUBLIC_SITE_URL` com a URL final, por exemplo `https://seu-dominio.com`.
4. No Supabase Auth, adicione a URL da Vercel em Site URL e Redirect URLs.
5. Faça deploy.

## Segurança

- A service role do Supabase fica apenas no servidor.
- O bucket `gift-images` é privado.
- Imagens do rascunho são enviadas por `/api/uploads`, validadas no servidor e gravadas em caminho isolado por token aleatório.
- O banco usa RLS para limitar leitura e escrita ao dono da página depois que a conta é vinculada.
- A tabela `admin_users` é singleton, tem RLS habilitado e não possui policies públicas; apenas rotas server-side com service role consultam ou gravam dados administrativos.
- O painel admin nunca lê dados globais pelo cliente Supabase; tudo é agregado no servidor após validar a sessão admin.
- A página pública é renderizada no servidor e recebe URLs assinadas temporárias das imagens.
- O retorno do Checkout consulta a Stripe no servidor antes de ativar ou renovar páginas.
- Sem webhook, a ativação depende do retorno para `/checkout/success`. Para um MVP isso simplifica a operação; em escala, um webhook ainda pode ser adicionado como redundância.

## Estrutura Principal

- `app/`: rotas, páginas e APIs.
- `components/`: landing, fluxo, dashboard e página pública.
- `lib/`: Supabase, Stripe, planos, tipos e utilitários.
- `supabase/schema.sql`: comando SQL para criar banco, policies e storage.
- `supabase/admin_update.sql`: atualização incremental para adicionar admin e analytics em um banco existente.
- `supabase/erase.sql`: apaga tabelas, policies e bucket para recriar tudo do zero.
