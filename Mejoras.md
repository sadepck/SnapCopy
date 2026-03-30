# Mejoras para SnapCopy

Listado de mejoras pensadas para un estudiante que está aprendiendo desarrollo de apps. Están ordenadas de **más fácil a más difícil**, con explicación de por qué cada una importa y cómo empezar.

---

## Nivel 1 — Fácil (puedes hacer estas esta semana)

---

### 1. Cifrar las contraseñas de los usuarios

**Problema actual:** Las contraseñas se guardan en texto plano en AsyncStorage. Cualquiera que acceda al almacenamiento del dispositivo puede verlas directamente.

**Solución:** Usar una librería de hash como `crypto-js` para convertir la contraseña antes de guardarla.

```bash
npm install crypto-js
```

```typescript
import CryptoJS from 'crypto-js';

// Al registrar:
const hashedPassword = CryptoJS.SHA256(password).toString();

// Al hacer login:
const hashedInput = CryptoJS.SHA256(inputPassword).toString();
if (hashedInput === storedUser.password) { /* OK */ }
```

**Por qué importa:** Es una práctica básica de seguridad. Nunca se guardan contraseñas en texto plano.

---

### 2. Mostrar un indicador de carga mientras se genera el copy

**Problema actual:** Cuando se llama a la API de Gemini, no hay feedback claro. El usuario no sabe si la app se colgó o está procesando.

**Solución:** Hay un esqueleto de loading (shimmer) en el código pero podría mejorarse con un mensaje más claro o un spinner con texto.

```typescript
{isLoading && (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#00DF81" />
    <Text style={styles.loadingText}>Generando tu copy viral...</Text>
  </View>
)}
```

**Por qué importa:** La experiencia del usuario (UX) es fundamental. El usuario debe siempre saber qué está pasando.

---

### 3. Agregar un contador de imágenes seleccionadas

**Problema actual:** El límite es 5 imágenes pero no hay un contador visible que diga "2/5 imágenes".

**Solución:** Mostrar un texto pequeño debajo de los botones de imagen.

```typescript
<Text style={styles.counter}>{images.length}/5 imágenes</Text>
```

**Por qué importa:** La app se vuelve más intuitiva. El usuario no tiene que adivinar cuántas imágenes puede agregar.

---

### 4. Validar que haya al menos una imagen antes de generar

**Problema actual:** Si el usuario presiona "Generar" sin imágenes, la app falla silenciosamente o manda una solicitud vacía.

**Solución:** Deshabilitar el botón cuando no hay imágenes.

```typescript
<TouchableOpacity
  style={[styles.button, images.length === 0 && styles.buttonDisabled]}
  disabled={images.length === 0}
  onPress={generateCopy}
>
  <Text>Generar copy</Text>
</TouchableOpacity>
```

**Por qué importa:** Siempre validar inputs del usuario antes de procesar. Evita errores y mejora la experiencia.

---

### 5. Agregar confirmación antes de eliminar un copy guardado

**Problema actual:** En la pantalla de historial, al tocar "Eliminar" el copy desaparece inmediatamente sin confirmación.

**Solución:** Usar `Alert.alert` para pedir confirmación.

```typescript
const confirmarEliminacion = (id: string) => {
  Alert.alert(
    '¿Eliminar copy?',
    'Esta acción no se puede deshacer.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteCopy(id) }
    ]
  );
};
```

**Por qué importa:** Las acciones destructivas siempre deben confirmarse. Es un principio básico de UX.

---

## Nivel 2 — Intermedio (requieren un poco más de investigación)

---

### 6. Agregar un límite de intentos de login

**Problema actual:** Un usuario puede intentar contraseñas infinitamente sin ningún bloqueo.

**Solución:** Guardar en AsyncStorage cuántos intentos fallidos hubo y bloquear por 30 segundos tras 3 intentos.

```typescript
const MAX_INTENTOS = 3;
const BLOQUEO_MS = 30000; // 30 segundos

// Guardar intentos fallidos
await AsyncStorage.setItem('loginAttempts', JSON.stringify({
  count: intentosFallidos + 1,
  lastAttempt: Date.now()
}));

// Verificar bloqueo
const data = await AsyncStorage.getItem('loginAttempts');
if (data) {
  const { count, lastAttempt } = JSON.parse(data);
  const tiempoTranscurrido = Date.now() - lastAttempt;
  if (count >= MAX_INTENTOS && tiempoTranscurrido < BLOQUEO_MS) {
    // Mostrar mensaje de bloqueo
  }
}
```

**Por qué importa:** Protege contra ataques de fuerza bruta aunque sean simples.

---

### 7. Mover la API key de Gemini al backend

**Problema actual:** La API key de Gemini está en el cliente (`EXPO_PUBLIC_GEMINI_API_KEY`). En una app web, cualquier persona puede verla abriendo las DevTools del navegador.

**Solución:** El servidor en `/servidor` ya existe para esto. La app debería llamar al servidor propio en vez de llamar a Gemini directamente.

```typescript
// En lugar de llamar a Gemini directamente:
const response = await fetch('https://tu-servidor.com/api/generar-copy', {
  method: 'POST',
  body: JSON.stringify({ imageBase64, mimeType })
});
```

El servidor recibe la imagen, llama a Gemini con su propia API key (que queda segura en el servidor) y devuelve el resultado.

**Por qué importa:** Las API keys no deben exponerse en el cliente. Alguien podría robarla y usarla generando costos en tu cuenta.

---

### 8. Agregar un límite de tamaño de imágenes antes de enviar

**Problema actual:** Las imágenes se convierten a base64 y se envían a la API sin verificar si son demasiado grandes. Imágenes muy grandes pueden hacer que la solicitud falle o sea muy lenta.

**Solución:** Comprimir las imágenes antes de enviarlas usando `expo-image-manipulator`.

```bash
npm install expo-image-manipulator
```

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

const compressed = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 800 } }],
  { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
);
```

**Por qué importa:** Mejora la velocidad y reduce el consumo de datos del usuario.

---

### 9. Agregar búsqueda en el historial

**Problema actual:** Si el usuario tiene muchos copys guardados, no hay forma de buscar por empresa o por texto.

**Solución:** Agregar un input de búsqueda que filtre la lista en tiempo real.

```typescript
const [busqueda, setBusqueda] = useState('');

const copiesFiltradas = copys.filter(c =>
  c.company.toLowerCase().includes(busqueda.toLowerCase()) ||
  c.copyText.toLowerCase().includes(busqueda.toLowerCase())
);

// En el render:
<TextInput
  placeholder="Buscar por empresa o texto..."
  onChangeText={setBusqueda}
  value={busqueda}
/>
<FlatList data={copiesFiltradas} ... />
```

**Por qué importa:** La usabilidad cae drásticamente cuando hay muchos ítems sin búsqueda.

---

### 10. Agregar soporte para múltiples idiomas (i18n básico)

**Problema actual:** La app está hardcodeada en español. No hay forma de cambiar el idioma.

**Solución:** Crear un archivo de traducciones y usar un contexto para cambiar el idioma.

```typescript
// translations.ts
export const ES = {
  generate: 'Generar copy',
  history: 'Historial',
  companyPlaceholder: 'Nombre de tu empresa...',
};

export const EN = {
  generate: 'Generate copy',
  history: 'History',
  companyPlaceholder: 'Your company name...',
};
```

**Por qué importa:** Si el proyecto crece, internacionalizarlo desde el principio es mucho más fácil que hacerlo después.

---

## Nivel 3 — Avanzado (proyectos de fin de semana)

---

### 11. Reemplazar AsyncStorage con una base de datos real

**Problema actual:** Todos los datos (usuarios, copys, configuración) viven en AsyncStorage del dispositivo. Si el usuario cambia de dispositivo, pierde todo.

**Solución:** Integrar **Supabase** (PostgreSQL gratuito) o **Firebase** para guardar los datos en la nube.

```bash
npm install @supabase/supabase-js
```

Con Supabase, los usuarios pueden acceder a sus copys desde cualquier dispositivo y la autenticación se maneja de forma segura con email/password real.

**Por qué importa:** Las apps modernas sincronizan datos en la nube. AsyncStorage solo funciona en un dispositivo.

---

### 12. Agregar autenticación real con OAuth (Google / Apple)

**Problema actual:** La autenticación es casera y guarda contraseñas en texto plano.

**Solución:** Usar **Expo Auth Session** con Google OAuth o integrar Supabase Auth.

```bash
npm install expo-auth-session expo-crypto
```

Esto permite que los usuarios se registren con su cuenta de Google sin crear otra contraseña más.

**Por qué importa:** Es más seguro y más cómodo para el usuario. Reduce la fricción de registro.

---

### 13. Implementar notificaciones push cuando el admin actualiza el prompt

**Problema actual:** Cuando el admin cambia el prompt maestro, los usuarios no saben que hay una actualización hasta que abren la app.

**Solución:** Usar **Expo Notifications** para avisar a todos los dispositivos cuando hay un nuevo prompt.

```bash
npm install expo-notifications
```

El servidor envía una notificación push a todos los tokens registrados cuando el admin guarda cambios.

**Por qué importa:** Mantiene a los usuarios actualizados en tiempo real sin que tengan que abrir la app.

---

### 14. Agregar análisis de copys (cuáles funcionan mejor)

**Problema actual:** No hay forma de saber qué copys generados son los más efectivos o cuáles se comparten más.

**Solución:** Registrar eventos cuando el usuario copia, comparte o guarda un copy. Mostrar estadísticas simples en la pantalla de historial.

```typescript
// Al copiar:
await trackEvent('copy_copied', { company, length: copyText.length });

// En historial:
const masCopiado = copys.reduce((max, c) => c.copies > max.copies ? c : max);
```

**Por qué importa:** Los datos de uso ayudan a mejorar el producto. Es el primer paso hacia un producto data-driven.

---

### 15. Separar la app en un monorepo con Turborepo

**Problema actual:** `app-movil`, `servidor` y `web-auth` son proyectos independientes sin configuración compartida. Compartir tipos TypeScript o constantes entre ellos es difícil.

**Solución:** Reorganizar con **Turborepo** o **Nx** para tener un workspace con paquetes compartidos.

```
snapcopy/
├── apps/
│   ├── mobile/     → Expo app
│   └── server/     → Express API
├── packages/
│   ├── types/      → Tipos TypeScript compartidos
│   └── utils/      → Funciones compartidas
└── package.json    → Workspace root
```

**Por qué importa:** Cuando el proyecto crece, compartir código entre apps evita duplicación y bugs por inconsistencias.

---

## Resumen de prioridades

| # | Mejora | Dificultad | Impacto |
|---|--------|------------|---------|
| 1 | Cifrar contraseñas | Fácil | Alto (seguridad) |
| 2 | Indicador de carga claro | Fácil | Alto (UX) |
| 3 | Contador de imágenes | Fácil | Medio (UX) |
| 4 | Validar imágenes antes de generar | Fácil | Alto (bugs) |
| 5 | Confirmación al eliminar | Fácil | Medio (UX) |
| 6 | Límite de intentos de login | Intermedio | Medio (seguridad) |
| 7 | Mover API key al servidor | Intermedio | Muy alto (seguridad) |
| 8 | Comprimir imágenes | Intermedio | Alto (rendimiento) |
| 9 | Búsqueda en historial | Intermedio | Alto (UX) |
| 10 | Soporte de idiomas | Intermedio | Medio (crecimiento) |
| 11 | Base de datos en la nube | Avanzado | Muy alto (escalabilidad) |
| 12 | OAuth (Google/Apple) | Avanzado | Alto (seguridad + UX) |
| 13 | Notificaciones push | Avanzado | Medio (engagement) |
| 14 | Análisis de copys | Avanzado | Medio (datos) |
| 15 | Monorepo | Avanzado | Alto (organización) |

---

## Por dónde empezar

Si recién estás aprendiendo, el orden recomendado es:

1. Haz las mejoras 4 y 5 primero — son de una sola línea/bloque de código y se ven de inmediato.
2. Luego la 2 — entender cómo funciona el estado de carga es fundamental.
3. Luego la 1 — instalar `crypto-js` y aprender a importar librerías externas.
4. Cuando te sientas cómodo con lo anterior, encarar la 7 y conectar el servidor existente.
5. Finalmente la 11 con Supabase para aprender bases de datos reales.
