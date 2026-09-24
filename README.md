# Orçah

SaaS mobile-first para prestadores de serviço criarem orçamentos profissionais, enviarem pelo WhatsApp e acompanharem até o cliente responder.

## Stack

- **App:** Node.js + Next.js + TypeScript + Tailwind
- **Banco:** MySQL 8 do WAMP + Prisma
- **Não usar:** PHP, Composer, Laravel

## Docs

- [Produto](docs/produto.md)
- [Ordem de construção](docs/ordem.md)
- [Modelos por categoria](docs/modelos-categorias.md)
- [Ramos do cadastro](docs/ramos.md)
- [Paleta](docs/paleta.md)
- [Concorrente Orçaki](docs/concorrente-orcaki.md)

## Marca

Arquivos em `public/brand/`.

## Subir local

1. WAMP ligado (MySQL).
2. Copiar `.env.example` para `.env`.
3. `npm run dev`
4. [http://localhost:3000](http://localhost:3000)

## Banco

Com o WAMP/MySQL ligado:

```bash
npx prisma migrate dev
npx prisma db seed
```
