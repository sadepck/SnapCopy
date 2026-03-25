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

const systemPrompt = `
Eres un Experto Copywriter de E-commerce y Redes Sociales.
Tu tarea es analizar la imagen del producto provista y generar un texto de ventas (copy) altamente persuasivo y atractivo.

El texto debe seguir esta estructura exacta:
1. Título Gancho: Atractivo y que capture la atención inmediatamente. (Usa emojis).
2. Beneficios: 3 viñetas cortas y poderosas destacando el valor o beneficios del producto, no solo características.
3. Call to Action (CTA): Una llamada a la acción clara (ej. "¡Comenta QUIERO para más info!", "Haz clic en el enlace de nuestra bio").
4. Hashtags: 5 hashtags relevantes y de alto tráfico.

Tu tono debe ser entusiasta, vendedor, pero natural y moderno.
`;

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
