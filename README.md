# SnapCopy

Aplicación móvil y web que genera **copy viral para redes sociales** a partir de fotos de productos, usando inteligencia artificial (Google Gemini).

---

## ¿Qué hace?

El usuario toma una foto (o sube una imagen) de un producto, escribe el nombre de su empresa y la IA genera automáticamente:

- **Título** llamativo
- **Enganche/Hook** para captar atención
- **Descripción** persuasiva
- **Hashtags** relevantes

El resultado puede copiarse, compartirse o guardarse en un historial personal.

---

## Estructura del proyecto

```
SnapCopy/
├── app-movil/          → App principal (Expo / React Native)
├── servidor/           → Backend Node.js + Express (API alternativa)
├── web-auth/           → Página de autenticación en HTML/CSS/JS puro
└── netlify.toml        → Configuración de despliegue global en Netlify
```

---

## app-movil (app principal)

Construida con **Expo 54** y **React Native 0.81.5**. Funciona en Android, iOS y Web.

### Estructura interna

```
app-movil/
├── app/
│   ├── _layout.tsx     → Layout raíz, maneja autenticación
│   ├── index.tsx       → Pantalla principal (generar copy)
│   ├── auth.tsx        → Login y registro de usuarios
│   ├── history.tsx     → Historial de copys guardados
│   ├── admin.tsx       → Panel de control del administrador
│   └── modal.tsx       → Modal genérico (sin uso activo)
│
├── components/
│   ├── SplashScreen.tsx     → Pantalla de carga animada
│   ├── Toast.tsx            → Notificaciones emergentes
│   ├── themed-text.tsx      → Texto adaptado al tema (claro/oscuro)
│   ├── themed-view.tsx      → Contenedor adaptado al tema
│   ├── external-link.tsx    → Links externos seguros
│   ├── haptic-tab.tsx       → Tabs con vibración háptica (iOS)
│   ├── parallax-scroll-view.tsx → Scroll con efecto parallax
│   └── ui/
│       ├── icon-symbol.tsx
│       └── icon-symbol.ios.tsx
│
├── hooks/
│   ├── useAuth.tsx              → Contexto de autenticación global
│   ├── use-theme-color.ts       → Colores según tema
│   ├── use-color-scheme.ts      → Detecta modo claro/oscuro (nativo)
│   └── use-color-scheme.web.ts  → Detecta modo claro/oscuro (web)
│
├── utils/
│   └── savedCopys.ts    → CRUD de copys guardados en AsyncStorage
│
├── constants/
│   └── theme.ts         → Paleta de colores y tipografía
│
├── netlify/
│   └── functions/
│       └── master-prompt.js  → Función serverless para sincronizar prompt
│
├── assets/              → Imágenes, íconos y fuentes
├── .env                 → Variables de entorno (API keys)
├── app.json             → Configuración de la app (Expo)
├── eas.json             → Configuración de builds (EAS)
├── netlify.toml         → Configuración local de Netlify Dev
├── package.json         → Dependencias
└── tsconfig.json        → Configuración TypeScript
```

---

## Pantallas

### auth.tsx — Login / Registro

Pantalla de entrada a la app. El usuario puede:

- **Registrarse** con nombre, email y contraseña (mínimo 6 caracteres)
- **Iniciar sesión** con email y contraseña

Los datos se guardan localmente con `AsyncStorage`. No hay servidor de autenticación.

**Claves de AsyncStorage usadas:**
- `snapcopy_users` → lista de usuarios registrados
- `snapcopy_session` → sesión activa actual

---

### index.tsx — Generación de copy (pantalla principal)

El corazón de la app. Permite:

1. Seleccionar hasta **5 imágenes** (cámara o galería)
2. Ingresar el **nombre de la empresa** (opcional)
3. Presionar **Generar** para llamar a la API de Gemini
4. Ver los copys generados en tarjetas
5. **Copiar**, **compartir** o **guardar** cada copy

La IA usa un prompt configurable por el admin. Si no hay prompt personalizado, usa uno por defecto en español.

**Memoria evolutiva**: guarda los últimos 5 copys generados para que la IA mejore con el tiempo.

**Acceso oculto al admin**: tocar el título 5 veces abre el panel de administrador.

**Claves de AsyncStorage usadas:**
- `learningHistory` → historial de aprendizaje (máx 5)
- `customSystemPrompt` → prompt personalizado
- `promptVersion` → versión del prompt activo
- `evolutionaryMemoryEnabled` → activa/desactiva memoria

---

### history.tsx — Historial

Lista todos los copys guardados por el usuario actual. Por cada uno muestra:

- Miniatura de la imagen
- Nombre de la empresa
- Fecha de creación
- Texto del copy (vista previa)

Acciones disponibles: **Copiar**, **Descargar imagen**, **Eliminar**.

**Clave de AsyncStorage:** `snapcopy_saved_{email}`

---

### admin.tsx — Panel de administrador

Accesible con contraseña (`EXPO_PUBLIC_ADMIN_PASSWORD`). Permite:

- **Editar el prompt maestro** que usan todos los dispositivos
- **Activar/desactivar** la memoria evolutiva
- **Sincronizar** la configuración a la nube (Netlify Blobs)
- **Borrar** el historial de aprendizaje de la IA

La configuración guardada en la nube se descarga automáticamente cada vez que cualquier dispositivo abre la app.

---

## Función serverless — master-prompt.js

Endpoint: `/.netlify/functions/master-prompt`

| Método | Acceso | Descripción |
|--------|--------|-------------|
| GET    | Público | Lee el prompt maestro desde Netlify Blobs |
| POST   | Admin (contraseña) | Guarda un nuevo prompt en la nube |

Usa **Netlify Blobs** como base de datos de clave/valor en la nube.

---

## servidor/ (backend alternativo)

API REST en **Node.js + Express** que recibe una imagen en base64 y llama a Gemini por cuenta propia.

**Ruta principal:** `POST /api/generar-copy`

```json
// Request
{ "imageBase64": "data:image/jpeg;base64,...", "mimeType": "image/jpeg" }

// Response
{ "copy": "📍 Título: ...\n🔥 Enganche: ..." }
```

> **Nota:** La app actualmente llama a Gemini directamente desde el frontend (sin pasar por este servidor). El servidor existe como alternativa pero no está integrado en la versión web actual.

---

## web-auth/ (página de autenticación independiente)

Página HTML/CSS/JS pura sin frameworks. Implementa el mismo flujo de login/registro que la app móvil pero en el navegador. Guarda datos en `localStorage`.

> **Nota:** Esta página no está integrada con la app principal. Es un componente independiente/huérfano.

---

## Flujo de datos

### Generación de copy

```
Usuario selecciona imágenes
        ↓
Ingresa nombre de empresa
        ↓
App carga config (nube → local → default)
        ↓
Llama a Gemini 2.5 Flash con imágenes en base64
        ↓
Muestra copys generados
        ↓
Usuario copia / comparte / guarda
```

### Sincronización de config admin

```
Admin edita prompt en admin.tsx
        ↓
POST a /.netlify/functions/master-prompt
        ↓
Se guarda en Netlify Blobs
        ↓
Cualquier dispositivo al abrir la app → GET al mismo endpoint
        ↓
Si versión es más nueva → actualiza prompt local
```

---

## Stack tecnológico

| Área | Tecnología |
|------|------------|
| Framework | Expo 54 / React Native 0.81.5 |
| Lenguaje | TypeScript 5.9.2 |
| Routing | Expo Router 6 (basado en archivos) |
| Estado global | React Context API |
| Almacenamiento local | AsyncStorage |
| Animaciones | React Native Animated + Reanimated 4 |
| IA | Google Gemini 2.5 Flash |
| Iconos | @expo/vector-icons (Ionicons, Feather, Material) |
| Backend | Node.js + Express 5 |
| Hosting | Netlify (web) + EAS (móvil) |
| Funciones cloud | Netlify Functions + Netlify Blobs |

---

## Variables de entorno

### app-movil/.env

```env
EXPO_PUBLIC_GEMINI_API_KEY=tu_api_key_de_gemini
EXPO_PUBLIC_ADMIN_PASSWORD=tu_contraseña_admin
```

### servidor/.env

```env
PORT=3000
GEMINI_API_KEY=tu_api_key_de_gemini
```

---

## Correr en local

### App móvil (web)

```bash
cd app-movil
npm install
netlify dev --offline     # Puerto 8888 (incluye funciones)
# o simplemente:
npx expo start --web      # Puerto 8081 (sin funciones)
```

### Backend

```bash
cd servidor
npm install
cp .env.example .env      # Configurar GEMINI_API_KEY
node server.js            # Puerto 3000
```

---

## Paleta de colores

| Nombre | Valor | Uso |
|--------|-------|-----|
| Primary Green | `#00DF81` | Botones, CTAs |
| Primary Dark | `#03624C` | Hover, bordes |
| Dark BG | `#000F0A` | Header |
| Light BG | `#F1F2F6` | Fondo principal |
| Text Dark | `#032221` | Texto principal |
| Text Secondary | `#707D7D` | Labels, subtítulos |
| Accent | `#20D295` | Acciones secundarias |

---

## Almacenamiento AsyncStorage — resumen

| Clave | Contenido |
|-------|-----------|
| `snapcopy_users` | Array de usuarios registrados |
| `snapcopy_session` | Sesión activa `{email, name}` |
| `snapcopy_saved_{email}` | Copys guardados del usuario |
| `customSystemPrompt` | Prompt de IA personalizado |
| `promptVersion` | Versión del prompt (`"2"`) |
| `evolutionaryMemoryEnabled` | `"true"` / `"false"` |
| `learningHistory` | Últimos 5 copys para contexto |

---

## Notas de seguridad

- Las contraseñas se guardan en texto plano (sin cifrado).
- La API key de Gemini está expuesta en el cliente web (visible en el bundle).
- El acceso admin se controla solo por contraseña del lado del cliente.
- No hay validación server-side de la autenticación de usuarios.
