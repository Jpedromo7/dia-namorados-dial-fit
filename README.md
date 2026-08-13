# Agosto dos Pais Dial Fit

**Pai forte. Família forte.**

Campanha de sorteio exclusiva para pais que sejam alunos ativos da Dial Fit.
Cada participante realiza a própria inscrição, confirma a avaliação e recebe um
número da sorte após aceitar o regulamento.

## Rotas

- `/` — apresentação, inscrição individual e confirmação.
- `/regulamento` — termos completos da campanha.
- `/admin` — validação de alunos, exportação e sorteio.

## Prêmio

Um pai vencedor recebe um combo com creatina da RR Suplementos, consulta online
com a Dra. Dayanne Botelho e kit de limpeza da Mult Limpo.

## Banco de dados

A migração `20260812000000_fathers_day_campaign.sql` preserva os registros da
campanha anterior, identifica cada edição pelo campo `campaign_slug` e permite
uma inscrição por CPF em cada campanha.

Crie um `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
CAMPAIGN_DEMO_MODE=false
```

O modo de demonstração só deve ser ativado localmente com
`CAMPAIGN_DEMO_MODE=true`; nele, os cadastros não são persistidos.

## Desenvolvimento

```bash
npm install
npm run dev -- --port 3025
```

Verificações:

```bash
npm run lint
npm run build
```
