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

## Área administrativa e importação mensal

A área pública continua sem login. A atualização de dados é feita em `/admin` e exige autenticação no servidor.

Configure no ambiente de produção:

- `ADMIN_USER`: usuário administrativo (opcional; padrão `admin`).
- `ADMIN_PASSWORD`: senha forte. **Obrigatória para habilitar o login**.
- `SESSION_SECRET`: segredo longo e aleatório para assinar sessões. **Obrigatório**.
- `DATA_DIR`: diretório persistente para `imports.json` (opcional; padrão `./data`).

Nunca coloque a senha no React, GitHub ou em arquivos públicos. Em produção, `DATA_DIR` precisa apontar para armazenamento persistente do provedor; se o ambiente de hospedagem usar disco efêmero, configure um volume/banco persistente antes de usar a importação como fonte definitiva.

Fluxo: `/admin` → login → selecionar CSV SIAPS → validação → confirmação de substituição se a competência já existir → publicação imediata no painel público. Nesta versão o importador automático cobre C1–C7; B1–B6, CVAT e quadrimestral ficam preparados como módulos, mas precisam de parsers específicos antes de liberar upload administrativo desses formatos.

### CSVs quadrimestrais
O Admin reconhece os relatórios SIAPS `Desempenho Quadrimestral - Componente Qualidade` e `Desempenho Quadrimestral - Componente Vínculo e Acompanhamento Territorial`. Arquivos com Q1/Q2/Q3 de anos diferentes são desmembrados por quadrimestre durante a importação; conflitos são verificados por componente + quadrimestre antes da gravação.

## Telas públicas adicionais

A base inclui telas públicas ligadas ao importador administrativo para Saúde Bucal (B1–B6), Vínculo e Acompanhamento Territorial e Desempenho Quadrimestral. As rotas públicas consultam exclusivamente os dados publicados pelo servidor e oferecem seleção de período/equipe, pesquisa, detalhamento e impressão/PDF. O público não possui controles de importação ou alteração.
