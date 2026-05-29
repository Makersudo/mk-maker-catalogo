# MK MAKER Deploy

Este projeto separa frontend, backend e banco. Nao grave credenciais reais em arquivos versionados.

## Banco

Execute todas as migrations em ordem dentro de `supabase/migrations/`.
Para um banco criado manualmente pelo painel do Supabase, use esta ordem:

1. Execute `database/schema.sql`.
2. Execute `database/policies.sql`.
3. Execute `database/storage.sql`.
4. Execute `database/seed.sql` se quiser categorias iniciais de beleza.

Nao use seeds antigos de fitness/PulseFit neste projeto.

Variaveis necessarias para o backend:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_MEDIA_BUCKET=mk-maker-media
SUPABASE_PRODUCT_BUCKET=mk-maker-products
```

## Backend

O backend fica na pasta `backend`.

Comandos:

```bash
npm install
npm run build
npm run start
```

Variaveis obrigatorias:

```txt
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://url-publica-do-frontend
JWT_SECRET=valor-longo-aleatorio
ADMIN_EMAIL=email-do-admin
ADMIN_PASSWORD_HASH=hash-da-senha
```

Para gerar o hash da senha:

```bash
ADMIN_PASSWORD="senha-temporaria" npm run hash-password --workspace backend
```

## Frontend

O frontend fica na pasta `frontend`.

Comandos:

```bash
npm install
npm run build
```

Variaveis:

```txt
VITE_API_URL=https://url-publica-do-backend
VITE_INSTAGRAM_URL=https://www.instagram.com/perfil
```
