# Dial Fit — Black Friday de Arrepiar 2026

Aplicação da campanha de pré-lista, com experiência pública mobile-first e CRM protegido para atendimento da recepção.

## Rotas

- `/` — chamada, revelação da campanha, pré-cadastro e confirmação.
- `/privacidade` — finalidade, retenção de dados e canais de privacidade configuráveis.
- `/admin/login` — autenticação Google para contas autorizadas.
- `/admin/black-friday` — visão geral da operação.
- `/admin/black-friday/leads` — busca, filtros, atribuição, WhatsApp e histórico.
- `/admin/black-friday/relatorios` — indicadores e exportação CSV para administradores.
- `/admin/black-friday/equipe` — cadastro e gestão de acessos para administradores.

## Configuração

Preencha as variáveis em `.env.local` (ou no ambiente de preview da Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
BLACK_FRIDAY_BOOTSTRAP_ADMIN_EMAIL=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_BLACK_FRIDAY_AUDIO_URL=
NEXT_PUBLIC_DATA_CONTROLLER_NAME=
NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=
NEXT_PUBLIC_PRIVACY_CONTACT_WHATSAPP=
CRON_SECRET=
```

`ADMIN_EMAILS` e `BLACK_FRIDAY_BOOTSTRAP_ADMIN_EMAIL` só inicializam a primeira conta administradora no backend. Depois da migração, novos acessos são controlados pelo painel da equipe. Configure no Supabase Auth o login Google e os endereços de retorno da Vercel Preview.

Configure a razão social aprovada e um canal oficial em `NEXT_PUBLIC_DATA_CONTROLLER_NAME`, `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` ou `NEXT_PUBLIC_PRIVACY_CONTACT_WHATSAPP` antes de divulgar a campanha. O áudio é opcional; sem `NEXT_PUBLIC_BLACK_FRIDAY_AUDIO_URL`, a experiência segue com uma sinalização sonora sintetizada e a revelação automática.

## Banco e dados históricos

A migração `supabase/migrations/20261103055448_black_friday_prelist_crm.sql` acrescenta tabelas específicas, mantém RLS ativo e não altera as tabelas nem registros das campanhas anteriores. Revise e aplique primeiro em um ambiente Supabase de desenvolvimento autorizado. Não aplique em produção antes da aprovação da campanha.

A rotina diária em `/api/cron/black-friday-retention` remove os cadastros Black Friday e o histórico associado após 12 meses, além de chaves de limitação de envios após 24 horas. O agendamento é configurado em `vercel.json`; defina `CRON_SECRET` no ambiente Vercel para ativá-lo.

## Desenvolvimento e validação

```bash
npm install
npm run dev -- --port 3025
npm run lint
npx tsc --noEmit
npm run build
```
