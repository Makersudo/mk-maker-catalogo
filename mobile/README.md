# MK MAKER Catalogo Mobile

App Android-first em Expo/React Native para o catalogo MK MAKER.

## Escopo implementado nesta base local

- Cliente sem login.
- Entrada por codigo/link de loja, simulando deep link/QR.
- Cliente preso a loja ativa.
- Catalogo estilo MK MAKER.
- Favoritos locais por loja.
- Carrinho local persistente por loja.
- Dados de checkout lembrados no aparelho.
- Pedido pendente salvo no estado do app antes do handoff para WhatsApp.
- Area admin com login demo.
- Dashboard com plano, limites e alertas.
- Produtos, pedidos, status e configuracoes/QR em UX mobile inicial.
- Tema claro/escuro.

## Comandos

Use Node >= 20.19.4.

```powershell
npm run lint --workspace mobile
npm run android --workspace mobile
```

Por padrao o app procura a API local em `http://localhost:3101`, para nao disputar as portas `3000` e `3001` com frontends locais.
Para apontar para outra API:

```powershell
$env:EXPO_PUBLIC_API_URL='http://SEU_IP:3101'
npm run dev:mobile -- --lan
```

## Integracao real

O app consome a mesma API do SaaS quando ela esta configurada:

- `GET /api/mobile/store/:slug`
- `POST /api/orders`
- `POST /api/auth/login`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/products/admin`
- `GET/PUT /api/settings`

Sem Supabase configurado no backend, o app cai para o modo local/demo para visualizacao.
