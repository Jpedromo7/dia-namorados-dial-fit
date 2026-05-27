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

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Verificação

```bash
npm run lint
npm run build
```

O projeto usa Next.js, TypeScript, Tailwind CSS e componentes React organizados por campanha em `src/components/campaign`.
