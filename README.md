# Dia dos Namorados Dial Fit

Página de campanha da Dial Fit para cadastro de alunos ativos no sorteio de Dia dos Namorados. O prêmio divulgado é um jantar para casal no Restaurante Lombardia.

## Rotas

- `/` - página pública da campanha, com hero, contador, prêmio, formulário, CTA de avaliação, aceite do regulamento e lista pública segura.
- `/admin` - painel administrativo inicial com dados mockados, filtro por unidade, edição de status, exportação CSV e sorteio.

## Configuração rápida

As principais constantes da campanha ficam em `src/config/campaign.ts`:

- `DRAW_DATE`
- `DIAL_FIT_GOOGLE_REVIEW_URL`
- `DIAL_BEACH_GOOGLE_REVIEW_URL`
- `CAMPAIGN_RULES_URL`

Crie um `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
```

`SUPABASE_SERVICE_ROLE_KEY` fica somente no servidor. Nunca use essa chave em
componentes client-side nem exponha no navegador.

No Supabase Auth, adicione os redirects locais:

```txt
http://localhost:3025/**
http://localhost:3025/auth/callback
```

Para produção, troque `localhost` pelo domínio publicado.

## Segurança

- As rotas públicas retornam somente número de inscrição e nomes abreviados.
- CPF, e-mail e telefone ficam restritos ao servidor/admin.
- As APIs POST/PATCH validam origem, tamanho do JSON, limite de tentativas e
  campos obrigatórios.
- O painel admin envia magic link apenas pelo servidor e valida `ADMIN_EMAILS`.
- As migrações do Supabase habilitam RLS e revogam acesso direto de
  `anon`/`authenticated` às tabelas da campanha.

## Desenvolvimento

```bash
npm install
npm run dev -- --port 3025
```

Abra `http://localhost:3025`.

## Verificação

```bash
npm run lint
npm run build
```

O projeto usa Next.js, TypeScript, Tailwind CSS e componentes React organizados por campanha em `src/components/campaign`.
