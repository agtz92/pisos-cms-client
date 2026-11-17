# @pisos/cms-client

Capa de datos para los **sitios a la medida** alimentados por el CMS de pisos-spc
(GraphQL pública `/t/<slug>/graphql/`). Sin componentes visuales: cada sitio pone su diseño.

Usado por: `matmarkt` (desde 0.1.0). `cortina-hawaiana` todavía tiene su copia en `lib/cms/`
(misma versión; migrarlo es un PR aparte).

## Instalar

```bash
pnpm add github:agtz92/pisos-cms-client#v0.1.0
```

`next.config.ts` — el paquete trae TypeScript sin compilar:

```ts
transpilePackages: ['@pisos/cms-client'],
```

Variables que lee: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_TENANT_SLUG`, `REVALIDATE_SECRET`,
`NEXT_PUBLIC_SITE_URL` (opcional).

## Módulos

| Import | Qué es | Origen |
|---|---|---|
| `@pisos/cms-client/graphql` | `gql`, `TAGS`, tipos, todas las queries, `resolveMediaUrl` | `website/lib/graphql.ts` (única diferencia: `gql` exportado) |
| `@pisos/cms-client/extra` | Campos agregados por los sitios a la medida: contacto del negocio, FAQs de producto, productos elegidos del LP, specs por slug, filtros y orden del catálogo | propio |
| `@pisos/cms-client/redirects` | `handleRedirects(req)` para `middleware.ts` | `website/middleware.ts` |
| `@pisos/cms-client/revalidate` | `POST` del webhook de revalidación | `website/app/api/revalidate/route.ts` |
| `@pisos/cms-client/contact-proxy` | `POST` del proxy de contacto (sin CORS) | `cortina-hawaiana/app/api/contact/route.ts` |
| `site-url`, `module-seo`, `landing-page-seo`, `modules`, `product-gallery`, `strip-markdown`, `types` | Helpers | `website/lib/` |

Uso en las rutas (la config de segmento tiene que ser literal en el archivo de la ruta):

```ts
// app/api/revalidate/route.ts
export { POST } from '@pisos/cms-client/revalidate';

// app/api/contact/route.ts
export { POST } from '@pisos/cms-client/contact-proxy';
export const maxDuration = 60;

// middleware.ts
import { handleRedirects } from '@pisos/cms-client/redirects';
export function middleware(req: NextRequest) { return handleRedirects(req); }
export const config = { matcher: [/* literal, ver matmarkt/middleware.ts */] };
```

## Reglas

- **Repo público**: solo código contra la API pública. Nunca secretos, nunca URLs internas ni datos de clientes.
- **No agregar timeout a `gql()`.** Un timeout ahí convierte renders lentos en 404 horneados.
- **No renombrar `TAGS`.** El backend (`backend/content/signals.py`) depende de ellos.
- **No quitar** el caché de 60 s, el timeout de 2.5 s ni el fail-safe de `redirects.ts`.
- Campos nuevos del backend van en `extra.ts`; `graphql.ts` se mantiene igual a `website/lib/graphql.ts`.
- Cada cambio: subir `version`, anotar en `CHANGELOG.md`, crear tag `vX.Y.Z`, y actualizar el tag en cada sitio.
  Un sitio nunca apunta a una rama, siempre a un tag.
