# Painel de Saúde — São Sebastião/SP

Projeto reconstruído do painel municipal de indicadores de saúde de São Sebastião/SP, preparado para republicação no Manus Web Dev.

## Stack

- React 19 + TypeScript
- Vite
- Express
- Tailwind CSS / componentes Radix UI
- pnpm

## Executar localmente

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```

## Publicação no Manus

1. Importe este repositório em uma nova tarefa Web Dev na conta Manus que possui o domínio.
2. Peça ao Manus para preservar o layout, os indicadores, a navegação e os dados existentes.
3. Publique primeiro no endereço temporário `.manus.space` e valide o painel.
4. Depois, em **Settings → Domains**, conecte `indicadorsaosebastiao.xyz`.

## Dados e edição

O painel usa dados locais/mock como base e possui editor local no navegador. A evolução prevista é permitir importação de CSV/Excel e séries históricas por competência/equipe.

## Segurança

Nenhuma senha fixa de administrador é necessária nesta versão. Arquivos `.env` e variantes estão ignorados pelo Git.
