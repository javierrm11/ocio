# Ozio

**Ozio** es una aplicación web progresiva (PWA) de ocio nocturno. Permite descubrir locales, consultar el ambiente en tiempo real, hacer check-in, explorar eventos cercanos y acumular puntos por participación.

URL de producción: [ocio-virid.vercel.app](https://ocio-virid.vercel.app)

---

## Tech Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.4 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS | ^4 |
| Base de datos | Supabase (PostgreSQL) | ^2.91.1 |
| Autenticación | Supabase Auth (email + Google OAuth) | — |
| Mapas | Leaflet + React-Leaflet | 1.9.4 / 5.0.0 |
| Estado global | Zustand | ^5.0.11 |
| Email | Resend | ^6.10.0 |
| Charts | Recharts | ^3.7.0 |
| Analytics | Vercel Analytics | ^2.0.1 |
| IA | Anthropic SDK | ^0.71.2 |
| Deploy | Vercel | — |

---

## Funcionalidades

### Mapa interactivo
- Mapa en tiempo real con OpenStreetMap
- Localización GPS del usuario con `watchPosition`
- Marcadores de locales con color según ambiente: tranquilo / animado / lleno
- Pulsos animados en locales con eventos activos o próximos
- Panel lateral al seleccionar un local con info, eventos y acciones
- Filtros por distancia máxima y nivel de ambiente
- Cierre automático del dropdown al hacer clic fuera

### Eventos
- Listado de todos los eventos con búsqueda en tiempo real
- Filtros por estado: en curso, hoy, esta semana, todos
- Ordenación automática: activos primero, luego próximos, luego pasados
- Badge animado para eventos en curso
- Tracking de asistentes por evento

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
- Check-in basado en ubicación con validación de radio (300 m)
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
- Cierre de sesión global con limpieza de cookies y store

### Gamificación (puntos)
- Sistema de puntos por acciones del usuario
- Historial de puntos
- Niveles basados en puntos acumulados

### Historias
- Publicación y visualización de stories por usuarios y establecimientos

### Premium
- Plan premium con funcionalidades ampliadas
- Integración con sistema de notificaciones de plan

### Notificaciones
- Notificaciones en tiempo real via triggers de Supabase
- Centro de notificaciones en la aplicación

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
│   ├── anadir/            # Crear local (admin)
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
│   ├── mapa/              # Componentes del mapa
│   ├── auth/              # Login, Register, Profile
│   ├── eventos/           # Tarjetas y listas de eventos
│   ├── buscar/            # Componente de búsqueda
│   ├── layout/            # Header, modales de bienvenida
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
├── AppInitializer.tsx     # Carga inicial: venues, events, user, location
├── layout.tsx             # Root layout + metadata SEO/OG
└── globals.css            # Estilos globales
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
points_history    -- Historial de puntos por acción
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

# Linting
npm run lint
```

---

## Mejoras pendientes y errores conocidos

### Seguridad
- [✅] **Cookies sin flags de seguridad** — El token de sesión se guarda en una cookie accesible desde JavaScript. Añadir `httpOnly`, `Secure` y `SameSite=Strict` para proteger contra XSS y CSRF. Actualmente cualquier script en la página puede leer el token.

### Calidad de código
- [✅] **Componente mapa de 1.700+ líneas** — [mapa.tsx](app/components/mapa/mapa.tsx) agrupa mapa, marcadores, filtros, panel lateral y lógica de check-in en un solo fichero. Dividirlo en sub-componentes (e.g. `MapMarkers`, `VenuePanel`, `MapFilters`) facilitaría el mantenimiento y los tests.

### Rendimiento
- [✅] **`next.config.ts` vacío** — Configurar `images.remotePatterns` para que Next.js optimice las imágenes de avatares y portadas servidas desde Supabase Storage.
- [✅ ] **Sin `useMemo` / `useCallback` en el mapa** — El componente recalcula filtros y marcadores en cada render. Memoizar los valores derivados reduciría renders innecesarios.
- [✅] **Carga inicial bloqueante** — `AppInitializer` espera venues y events en serie antes de marcar `loaded = true`. Separar las cargas y mostrar contenido progresivamente mejoraría el tiempo de primera interacción.

### Funcionalidad
- [✅] **Fallback de ubicación hardcodeado a Córdoba** — Si el usuario deniega la geolocalización, el mapa centra en Córdoba sin aviso. Mostrar un modal o banner explicativo con opción de introducir ciudad manualmente.
- [✅] **Sin suite de tests** — No existe ningún fichero `.test.ts` / `.spec.ts`. Al menos la validación de radio de check-in (300 m), la autenticación y el cálculo de distancia deberían cubrirse con tests unitarios.
- [✅] **Sin rate limiting en las rutas API** — Endpoints como `/api/auth/login` o `/api/checkins` son susceptibles a abuso. Añadir rate limiting (e.g. con `upstash/ratelimit` o middleware de Vercel).

### Pendientes de producto
- [✅] Fix z-index de los filtros del mapa (se solapan con el panel lateral)
- [✅] SEO Html5
- [✅] Añadir buscar local desde el mapa
- [✅] Historias en la vista de los establecimientos
- [✅] Control de seguridad de rutas /anadir
- [ ] Utilizar todos los colores de las variables
- [ ] Fix color register, boton
- [ ] Arreglar hora pico
  
teniendo globals.css las variables de los colores neceito que todo el uso de colores utilize las variables de ozio actualiza el components/
