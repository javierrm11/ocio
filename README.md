# Ozio

**Ozio** es una aplicación web progresiva (PWA) de ocio nocturno. Permite descubrir locales, consultar el ambiente en tiempo real, hacer check-in, explorar eventos cercanos y acumular puntos por participación.

URL de producción: [ocio-virid.vercel.app](https://ocio-virid.vercel.app)

---

## Tech Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.4 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS v4 | ^4 |
| Base de datos | Supabase (PostgreSQL) | ^2.91.1 |
| Autenticación | Supabase Auth (email + Google OAuth) | — |
| Mapas | Leaflet + React-Leaflet | 1.9.4 / 5.0.0 |
| Estado global | Zustand | ^5.0.11 |
| Email | Resend | ^6.10.0 |
| Charts | Recharts | ^3.7.0 |
| Analytics | Vercel Analytics | ^2.0.1 |
| IA | Anthropic SDK | ^0.71.2 |
| Rate Limiting | Upstash Ratelimit + Redis | ^2.0.8 / ^1.37.0 |
| Validación | Zod | ^4.3.6 |
| Fechas | date-fns | ^4.1.0 |
| Drag & Drop | dnd-kit | ^6.3.1 |
| Tests | Vitest + happy-dom | ^4.1.4 |
| Deploy | Vercel | — |

---

## Funcionalidades

### Mapa interactivo
- Mapa en tiempo real con OpenStreetMap
- Localización GPS del usuario con `watchPosition`
- Marcadores de locales con color según ambiente: tranquilo / animado / lleno
- Iconos dinámicos con corona dorada para locales premium
- Pulsos animados en locales con eventos activos o próximos
- Panel lateral al seleccionar un local con info, eventos y acciones
- Filtros por distancia máxima y nivel de ambiente
- Barra de búsqueda de locales con vuelo animado al resultado
- Banner de ciudad manual si se deniega la geolocalización

### Eventos
- Listado de todos los eventos con búsqueda en tiempo real
- Filtros por estado: en curso, hoy, esta semana, todos
- Ordenación automática: activos primero, luego próximos, luego pasados
- Badge animado para eventos en curso
- Tracking de asistentes por evento
- Límite de 2 eventos/mes para usuarios free, ilimitado en premium

### Buscar
- Búsqueda de locales por nombre, dirección, descripción y género musical
- Filtros por distancia, ambiente, favoritos y eventos activos
- Chips de géneros musicales dinámicos
- Sugerencias de búsquedas populares
- Top 3 locales más visitados

### Perfil
- Vista diferenciada para usuarios y establecimientos
- Estadísticas: check-ins, favoritos, siguiendo
- Favoritos — locales guardados
- Historial de check-ins agrupado por fecha con paginación
- Edición de perfil (nombre, username, descripción, avatar)
- Creación y gestión de eventos (solo establecimientos)
- Estado del plan premium

### Check-in
- Check-in basado en ubicación con validación de radio (300 m, fórmula Haversine)
- Check-out en tiempo real
- Sincronización inmediata en el mapa y en el store global
- Historial de check-ins en el perfil

### Favoritos
- Añadir y quitar favoritos desde el mapa, detalle del local y perfil
- Sincronización global del estado de favoritos

### Autenticación
- Login con email y contraseña
- Login con Google OAuth
- Opción "Recuérdame" (cookie de 30 días)
- Cookies con flags `httpOnly`, `Secure` y `SameSite=Strict`
- Cierre de sesión global con limpieza de cookies y store

### Gamificación (puntos)
- Sistema de puntos por acciones del usuario
- Historial de puntos con `point_transactions`
- Niveles basados en puntos acumulados

### Historias
- Publicación y visualización de stories por usuarios y establecimientos
- Stories con fecha de expiración (`expires_at`)
- Visualizadas en el header del mapa y en el detalle del local

### Premium
- Plan premium con funcionalidades ampliadas
- Control de límites en la API (eventos, etc.)
- Integración con sistema de notificaciones de plan

### Notificaciones
- Notificaciones en tiempo real via triggers de Supabase
- Centro de notificaciones con estado leído / archivado

### Seguridad y rendimiento
- Rate limiting en middleware con Upstash: auth (10/15 min), checkins (20/h), API general (100/min)
- Headers estándar `X-RateLimit-*`
- Carga inicial no bloqueante: venues y events en paralelo, perfil en background
- SEO completo: Open Graph, Twitter Card, robots

---

## Estructura del proyecto

```
app/
├── (app)/
│   ├── mapa/              # Mapa interactivo
│   ├── events/            # Listado de eventos
│   ├── events/[id]/       # Detalle de evento
│   ├── buscar/            # Búsqueda de locales
│   ├── profile/           # Perfil de usuario/establecimiento
│   ├── venues/[id]/       # Detalle de local
│   ├── anadir/            # Crear local (solo role: venue)
│   ├── notificaciones/    # Centro de notificaciones
│   ├── destacados/        # Locales destacados
│   └── premium/           # Gestión del plan premium
│
├── api/
│   ├── auth/              # Login, registro, logout, OAuth callback
│   ├── venues/            # CRUD locales
│   ├── events/            # CRUD eventos
│   ├── checkins/          # CRUD check-ins con validación de radio
│   ├── favorites/         # CRUD favoritos
│   ├── profiles/          # Perfil de usuario
│   ├── notifications/     # Sistema de notificaciones
│   ├── stories/           # Stories
│   ├── genres/            # Géneros musicales
│   ├── stats/             # Estadísticas
│   ├── points/            # Sistema de puntos
│   ├── eventAttendees/    # Asistentes a eventos
│   ├── destacados/        # Locales destacados
│   └── notify-plan/       # Notificaciones de plan
│
├── components/
│   ├── mapa/              # mapa.tsx, MapMarkers, VenuePanel, MapFilters, MapSearchBar
│   ├── auth/              # Login, Register, Profile (1200L)
│   ├── eventos/           # Tarjetas y listas de eventos
│   ├── buscar/            # Componente de búsqueda
│   ├── layout/            # Header, WelcomeEngagementModal
│   ├── Boton/             # Navegación inferior (BottomNav)
│   ├── Stories/           # Stories
│   ├── anadir/            # Formulario de creación de local
│   ├── premium/           # UI de premium
│   ├── notifications/     # UI de notificaciones
│   ├── destacados/        # UI de destacados
│   └── ui/                # Componentes base (Button, Input, Logo)
│
├── lib/
│   ├── stores/
│   │   └── venueStore.tsx # Store global (Zustand)
│   ├── supabase/
│   │   ├── client.ts      # Cliente Supabase (browser)
│   │   └── server.ts      # Cliente Supabase (server)
│   ├── auth/
│   │   └── get-user.ts    # Helper para obtener userId desde cookie
│   ├── hooks/
│   │   ├── getToken.ts    # Helper para leer token de cookie
│   │   └── plan.ts        # Comprobación de plan premium
│   └── utils/
│       └── distance.ts    # Cálculo de distancia Haversine
│
├── __tests__/             # Tests unitarios (Vitest)
│   ├── distance.test.ts
│   ├── checkin-radius.test.ts
│   ├── getToken.test.ts
│   └── heat.test.ts
│
├── middleware.ts          # Rate limiting global con Upstash
├── AppInitializer.tsx     # Carga inicial: venues, events, user, location
├── layout.tsx             # Root layout + metadata SEO/OG
└── globals.css            # Design system: variables CSS ozio-* y ambience-*
```

---

## Base de datos

```sql
profiles          -- Usuarios y establecimientos (role: user | venue)
venues            -- Locales nocturnos con coordenadas y nivel de ambiente
events            -- Eventos vinculados a locales con ventana temporal
check_ins         -- Check-ins de usuarios (validación radio 300 m)
favorites         -- Locales favoritos de cada usuario
genres            -- Géneros musicales
venue_genres      -- Relación locales <-> géneros
event_genres      -- Relación eventos <-> géneros
event_attendees   -- Asistentes por evento
stories           -- Stories de usuarios y establecimientos
notifications     -- Notificaciones de usuario
points            -- Puntos actuales del usuario
point_transactions -- Historial de puntos por acción
```

**Triggers activos:**
- `trigger_notify_venue_checkin` — notifica al local cuando un usuario hace check-in
- `trigger_notify_venue_checkin_deleted` — notifica al eliminar un check-in

---

## Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_xxxx
NEXT_PUBLIC_RESEND_API_KEY=re_xxxx
UPSTASH_REDIS_REST_URL=xxxx
UPSTASH_REDIS_REST_TOKEN=xxxx
ANTHROPIC_API_KEY=xxxx
```

> **Nunca subas el archivo `.env` al repositorio.** Ya está en `.gitignore`.

---

## Cómo ejecutar en local

```bash
# Instalar dependencias
npm install

# Arrancar en modo desarrollo
npm run dev        # http://localhost:3000

# Build de producción
npm run build
npm run start

# Tests
npm run test

# Linting
npm run lint
```

---

## Mejoras completadas

### Seguridad
- [✅] **Cookies con flags de seguridad** — `httpOnly`, `Secure` y `SameSite=Strict`
- [✅] **Rate limiting en rutas API** — Upstash Ratelimit en middleware con límites por categoría

### Calidad de código
- [✅] **Componente mapa dividido** — De 1.700+ líneas a sub-componentes: `MapMarkers`, `VenuePanel`, `MapFilters`, `MapSearchBar`
- [✅] **Suite de tests** — 4 tests unitarios: distancia Haversine, radio de check-in, lectura de token, categorías de ambiente

### Rendimiento
- [✅] **`next.config.ts` con `remotePatterns`** — Imágenes de Supabase optimizadas por Next.js
- [✅] **Carga inicial no bloqueante** — `AppInitializer` carga venues y events en paralelo; perfil y favoritos en background

### Funcionalidad
- [✅] **Fallback de ubicación con banner** — Si se deniega GPS, aparece un banner para introducir ciudad manualmente
- [✅] **Buscar local desde el mapa** — `MapSearchBar` con vuelo animado
- [✅] **SEO completo** — Open Graph, Twitter Card, robots
- [✅] **Historias en detalle de local** — Stories visibles en `/venues/[id]`
- [✅] **Control de acceso a `/anadir`** — Solo usuarios con `role: venue`
- [✅] **Design system de colores** — Variables CSS `ozio-*` y `ambience-*` en `globals.css`, registradas en Tailwind
- [✅] **Fix z-index filtros del mapa**
- [✅] **Fix color register/botón**

---

## Pendiente


- [ ] **App móvil nativa** — Los botones de App Store y Google Play están en la landing como "Próximamente"

---

## Próximas ideas

### Producto
- **Mapa de calor histórico** — Visualizar en el mapa la afluencia media por día de la semana y hora, usando el historial de check-ins agregado por local
- **Modo "salida de grupo"** — Crear una sala temporal donde varios usuarios coordinan a qué local van; el mapa muestra los pins del grupo en tiempo real
- **Descuentos y ofertas** — Los establecimientos pueden publicar promociones con hora de inicio/fin visibles en el mapa con un icono de oferta
- programar checkin entrada o salida

### Técnico
- **Realtime con Supabase Channels** — Sustituir el polling del store por suscripciones Realtime para que los check-ins y el ambiente se reflejen en el mapa sin refrescar

- **Unificar tipo `Venue`** — Hay dos definiciones ligeramente distintas en `venueStore.tsx` y `components/mapa/types.ts`; consolidarlas en `lib/types.ts`
- **Caché de venues en Service Worker** — Precachear los venues y el tile del mapa para que la PWA funcione offline o con mala conexión
- **Tests de integración** — Añadir tests para las rutas API críticas (`/api/checkins`, `/api/auth/login`) usando MSW o un entorno de test con Supabase local