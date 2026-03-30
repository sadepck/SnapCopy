const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
app.use(cors());
// Límite alto para parsear imágenes base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir la Aplicación Frontend unificada
app.use(express.static(path.join(__dirname, '../app-movil/dist')));

// Inicializar SDK de Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `Eres un experto en creación de contenido viral para redes sociales. Para cada solicitud, genera:

1. **Título**: Corto, impactante y optimizado para captar atención (máx. 10 palabras).
2. **Enganche (Hook)**: Una frase inicial que detenga el scroll del usuario (pregunta, dato impactante o controversia).
3. **Descripción**: Texto breve, directo y persuasivo que desarrolle la idea (máx. 3 oraciones).
4. **Hashtags**: 5-8 hashtags relevantes mezclando alto volumen y nicho.

REGLA DE EVOLUCIÓN:
- En la 1ª versión: entrega una base sólida y funcional.
- En la 2ª versión: mejora el copywriting, intensifica el enganche y ajusta el tono emocional.
- En la 3ª versión: optimiza para viralidad, añade urgencia o exclusividad y refina los hashtags.
- En cada versión posterior: sigue elevando la calidad aplicando técnicas avanzadas de persuasión, storytelling y tendencias actuales.

Numera cada versión (V1, V2, V3...) y al final de cada una indica brevemente qué mejoraste respecto a la anterior.

Formato de salida:
---
**[Vn] Título:** ...
**Enganche:** ...
**Descripción:** ...
**Hashtags:** ...
**Mejora aplicada:** ...
---

Sé breve, preciso y directo. No rellenes con texto innecesario..`;


app.post('/api/generar-copy', async (req, res) => {
  console.log('-----------------------------------');
  console.log('>>> NUEVA PETICIÓN RECIBIDA EN /api/generar-copy');
  try {
    const { imageBase64, mimeType } = req.body;
    console.log('>>> Datos recibidos. Tamaño Base64:', imageBase64 ? imageBase64.length : 0);

    if (!imageBase64) {
      console.log('>>> Error: No se envió imagen de forma correcta.');
      return res.status(400).json({ error: 'La imagen (imageBase64) es requerida.' });
    }

    if (!process.env.GEMINI_API_KEY) {
       console.log('>>> Error: No se encontró la API Key de Gemini en las variables de entorno.');
       return res.status(500).json({ error: 'La API Key de Gemini no está configurada en el servidor.' });
    }

    console.log('>>> Llamando a la API de Inteligencia Artificial (Gemini)...');
    // Usando la versión de modelo 2.5 compatible con tu cuenta
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Preparar el formato que espera Gemini para imágenes (inlineData)
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/jpeg'
      }
    };

    // Generar el contenido usando el prompt del sistema y la imagen
    const result = await model.generateContent([systemPrompt, imagePart]);
    console.log('>>> ¡Respuesta exitosa de Gemini obtenida!');
    
    const response = await result.response;
    const text = response.text();
    console.log('>>> Texto final extraído, longitud:', text.length, 'caracteres.');

    res.json({ copy: text });

  } catch (error) {
    console.error('>>> Error CATCH al generar copy en el servidor:', error);
    res.status(500).json({ error: 'Hubo un error al procesar la imagen y generar el copy.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de IA escuchando en el puerto ${PORT}`);
  console.log(`Asegúrate de configurar GEMINI_API_KEY en tu .env`);
});
