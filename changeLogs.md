# Changelog — SnapCopy

Registro de cambios del proyecto. Seguimos el formato [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y versionado semántico [SemVer](https://semver.org/lang/es/).

**Formato de versión:** `MAJOR.MINOR.PATCH`
- `MAJOR` → cambio que rompe compatibilidad
- `MINOR` → nueva funcionalidad compatible
- `PATCH` → corrección de bugs

---

## [Sin publicar]

> Cambios en desarrollo que aún no tienen versión asignada.

---

## [1.1.0] — 2026-03-30

### Agregado
- Archivo `README.md` con documentación completa del proyecto: estructura, pantallas, stack tecnológico, flujo de datos y variables de entorno.
- Archivo `Mejoras.md` con 15 propuestas de mejora organizadas por nivel de dificultad (fácil → avanzado).
- Archivo `changeLogs.md` (este archivo) para seguimiento de versiones.
- Configuración de `[dev]` en `app-movil/netlify.toml` para soporte de `netlify dev --offline` con las funciones serverless corriendo localmente en el puerto 8888.
- Archivo `.env` en `app-movil/` con las variables de entorno necesarias para desarrollo local.

### Modificado
- `app-movil/netlify.toml` — se agregó la sección `[functions]` y `[dev]` para habilitar el desarrollo local con Netlify CLI.

---

## [1.0.0] — Estado inicial del proyecto (clonado desde GitHub)

### Estado de la versión

Versión inicial funcional de la aplicación. Incluye todas las funcionalidades core del producto.

---

### app-movil

#### Pantallas

**auth.tsx**
- Login con email y contraseña
- Registro con nombre, email, contraseña y confirmación
- Validación de email duplicado
- Persistencia con AsyncStorage (`snapcopy_users`, `snapcopy_session`)
- Transición animada con SplashScreen al iniciar sesión

**index.tsx** (pantalla principal)
- Selección de hasta 5 imágenes desde cámara o galería
- Campo de nombre de empresa (opcional)
- Generación de copy con Google Gemini 2.5 Flash
- Memoria evolutiva: guarda los últimos 5 copys para mejorar la IA
- Acciones por copy: copiar, compartir, guardar
- Acceso oculto al admin: tocar el título 5 veces
- Animaciones de entrada escalonada (web y nativo)
- Modo web: animaciones CSS, shimmer skeleton, efectos ripple
- Descarga automática de configuración del prompt desde la nube al abrir la app

**history.tsx**
- Lista de copys guardados por usuario
- Miniatura de imagen, empresa, fecha y texto
- Acciones: copiar, descargar imagen, eliminar
- Estado vacío con mensaje y botón de regreso

**admin.tsx**
- Autenticación por contraseña (`EXPO_PUBLIC_ADMIN_PASSWORD`)
- Editor de prompt maestro con variables `{company}` y `{historyBlock}`
- Toggle de memoria evolutiva
- Sincronización a la nube (POST a `/.netlify/functions/master-prompt`)
- Función de amnesia (borrar historial de aprendizaje)
- Sistema de versiones de prompt (`PROMPT_VERSION = '2'`)

**_layout.tsx**
- Layout raíz con AuthProvider
- Redirección automática según estado de autenticación
- Control de transición para evitar navegación doble

---

#### Componentes

- **SplashScreen** — pantalla de carga con animación spring y puntos pulsantes
- **Toast** — notificaciones emergentes (éxito, error, info) con auto-dismiss a 2.5 s
- **ThemedText / ThemedView** — componentes adaptativos para modo claro/oscuro
- **ExternalLink** — wrapper seguro para links externos (in-app browser en iOS)
- **HapticTab** — vibración háptica en tabs (iOS únicamente)
- **ParallaxScrollView** — scroll con parallax (incluido por template Expo, sin integrar)

---

#### Hooks

- **useAuth** — contexto de autenticación global con `signIn`, `signOut`, `setTransitioning`
- **useThemeColor** — devuelve el color correcto según el tema activo
- **useColorScheme / useColorScheme.web** — detecta preferencia de modo claro/oscuro

---

#### Utilidades

- **savedCopys.ts** — CRUD completo para copys guardados en AsyncStorage por usuario:
  - `getSavedCopys()` — obtiene copys del usuario activo
  - `saveCopy(item)` — guarda un nuevo copy con ID y timestamp
  - `deleteSavedCopy(id)` — elimina un copy por ID
  - `getUserEmail()` — extrae el email de la sesión activa

---

#### Funciones serverless

**master-prompt.js** (`/.netlify/functions/master-prompt`)
- GET público: lee el prompt maestro desde Netlify Blobs
- POST protegido por contraseña: guarda nuevo prompt en Netlify Blobs
- CORS habilitado para todos los orígenes
- Fallback a `{prompt: null, evolutionaryMemory: true}` si no hay datos

---

#### Configuración

- **app.json** — nombre: SnapCopy, slug: snapcopy, paquete Android: `com.sadenero.appmovil`
- **eas.json** — builds: development (internal), preview (APK), production
- **tsconfig.json** — modo estricto habilitado, alias `@/*`
- **netlify.toml** — build con `npx expo export --platform web`, publish `dist/`, SPA redirect
- **package.json** — 44 dependencias de producción, React 19.1.0, Expo 54

---

### servidor/

- API REST con Express 5.2.1
- Ruta `POST /api/generar-copy` — recibe imagen en base64, llama a Gemini, devuelve copy
- Prompt con sistema de evolución V1→V4
- CORS habilitado, límite de body 50 MB
- Sirve estáticos desde `../app-movil/dist`
- Variables de entorno: `PORT`, `GEMINI_API_KEY`

---

### web-auth/

- Página de login/registro en HTML, CSS y JS puro (sin frameworks)
- Persistencia en `localStorage`
- Validaciones de formulario del lado del cliente
- UI con variables CSS, pestañas animadas
- Sin integración con la app principal (standalone)

---

### Infraestructura

- **Netlify** — hosting del frontend web con SPA redirect
- **Netlify Blobs** — almacenamiento de prompt maestro en la nube
- **Netlify Functions** — serverless para sincronización de configuración admin
- **EAS** — distribución móvil (Android/iOS)
- **Google Gemini 2.5 Flash** — modelo de IA para generación de copy

---

### Sistema de design

**Paleta de colores principal:**
- Primary Green: `#00DF81`
- Primary Dark: `#03624C`
- Dark BG: `#000F0A`
- Light BG: `#F1F2F6`
- Text Dark: `#032221`
- Text Secondary: `#707D7D`

**Bordes:** 12–18 px según componente
**Sombras:** 4 niveles de elevación definidos
**Tipografía:** System font (nativo), adaptada por plataforma

---

## Guía para registrar futuros cambios

Al agregar una entrada al changelog, usar esta plantilla:

```markdown
## [X.Y.Z] — AAAA-MM-DD

### Agregado
- Descripción de la nueva funcionalidad

### Modificado
- Descripción del cambio sobre algo existente

### Corregido
- Descripción del bug arreglado

### Eliminado
- Descripción de lo que se quitó

### Seguridad
- Descripción del fix de seguridad
```

Solo incluir las secciones que apliquen en cada versión.
