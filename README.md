# MK MAKER

Template piloto para catálogo fitness com frontend, backend e banco separados.

## Estrutura

```txt
frontend/   Interface React/Vite. Nao acessa banco diretamente.
backend/    API Express. Centraliza autenticacao, regras e Supabase.
database/   Schema, policies, storage e seed do banco.
```

## Regras de credenciais

Nao versionar tokens, senhas, service keys, URLs privadas ou dados reais de cliente.
Use apenas `.env.example` como modelo e configure valores reais no ambiente de cada cliente.

## Desenvolvimento

```bash
npm install
npm run dev:backend
npm run dev:frontend
```

## Validacao

```bash
npm run lint
npm run build
```
