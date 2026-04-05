# OZIO 🌙

**Ozio** es una aplicación web progresiva (PWA) de ocio nocturno que permite descubrir locales, consultar el ambiente en tiempo real, hacer check-in y explorar eventos cercanos.

---

## 🚀 Tech Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (email + Google OAuth) |
| Mapas | Leaflet + React-Leaflet |
| Estado global | Zustand |
| Deploy | Vercel |

---

## ✨ Funcionalidades actuales

### 🗺️ Mapa interactivo
- Mapa en tiempo real con OpenStreetMap
- Localización GPS del usuario con `watchPosition`
- Marcadores de locales con color según ambiente (tranquilo / animado / lleno)
- Pulsos animados en locales con eventos activos o próximos
- Panel lateral al seleccionar un local con info, eventos y acciones
- Filtros por distancia máxima y nivel de ambiente
- Cierre automático del dropdown al hacer clic fuera

### 🎉 Eventos
- Listado de todos los eventos con búsqueda en tiempo real
- Filtros por estado: en curso, hoy, esta semana
- Ordenación automática: activos primero, luego próximos, luego pasados
- Indicador visual de eventos en curso (badge animado)
- Navegación al detalle del evento

### 🔍 Buscar
- Búsqueda de locales por nombre, dirección, descripción y género musical
- Filtros por distancia, ambiente, favoritos y eventos activos
- Chips de géneros musicales dinámicos
- Sugerencias de búsquedas populares
- Top 3 locales más visitados en pantalla de inicio

### 👤 Perfil
- Vista diferenciada para usuarios y establecimientos
- Estadísticas: check-ins, favoritos, siguiendo
- ❤️ Favoritos — locales guardados
- 📍 Historial de check-ins agrupado por fecha con paginación
- ⚙️ Ajustes y configuración
- Edición de perfil (nombre, username, descripción, avatar)
- Creación y gestión de eventos (solo establecimientos)
- Cierre de sesión con limpieza de cookies y store

### 📍 Check-in
- Check-in y check-out en tiempo real
- Sincronización inmediata en el mapa y en el store global
- Feedback visual durante la acción (spinner + texto)
- Historial de check-ins en el perfil

### ❤️ Favoritos
- Añadir y quitar favoritos desde el mapa, detalle del local y perfil
- Sincronización global del estado de favoritos

### 🔐 Autenticación
- Login con email y contraseña
- Login con Google OAuth
- Opción "Recuérdame" (cookie de 30 días)
- Cierre de sesión global con invalidación de token

---

## 📁 Estructura del proyecto
```
app/
├── (app)/
│   ├── mapa/          # Mapa interactivo
│   ├── events/        # Listado de eventos
│   ├── buscar/        # Búsqueda de locales
│   ├── profile/       # Perfil de usuario
│   └── venues/[id]/   # Detalle de local
├── api/
│   ├── auth/          # Login / registro
│   ├── checkins/      # CRUD check-ins
│   ├── events/        # CRUD eventos
│   ├── favorites/     # CRUD favoritos
│   ├── profile/       # Perfil de usuario
│   └── venues/        # Listado y detalle de locales
├── auth/
│   └── callback/      # Callback OAuth Google
└── layout.tsx         # Layout global + AppInitializer

lib/
├── stores/
│   └── venueStore.ts  # Store global (Zustand)
├── supabase/
│   ├── client.ts      # Cliente Supabase (browser)
│   └── server.ts      # Cliente Supabase (server)
├── auth/
│   └── get-user.ts    # Helper para obtener userId
└── hooks/
    └── getToken.ts    # Helper para leer token de cookie
```

---

## 🗄️ Esquema de base de datos
```sql
profiles          -- Usuarios y establecimientos
venues            -- Locales nocturnos
events            -- Eventos de cada local
check_ins         -- Check-ins de usuarios en locales
favorites         -- Favoritos de usuarios
```

### Triggers activos
- `trigger_notify_venue_checkin` — notifica al hacer check-in
- `trigger_notify_venue_checkin_deleted` — notifica al eliminar check-in

---

## 🔧 Variables de entorno
```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

---

## 🏃 Cómo ejecutar en local
```bash
# Instalar dependencias
npm install

# Arrancar en desarrollo
npm run dev

# Build de producción
npm run build
```

---

## 🛣️ Mejoras
- Historias en las pestañas de las empresas
- Fix filtros z-index
- Circulo mas grande en funcion del plan del usuario
- Filtros