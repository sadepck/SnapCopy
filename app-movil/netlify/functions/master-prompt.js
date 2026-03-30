const { getStore } = require("@netlify/blobs");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const store = getStore("config");

  // GET: Cualquier dispositivo puede leer el prompt maestro
  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get("master-prompt");
      if (data) {
        return { statusCode: 200, headers, body: data };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ prompt: null, evolutionaryMemory: true })
      };
    } catch (e) {
      console.error('Error reading blob:', e);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ prompt: null, evolutionaryMemory: true })
      };
    }
  }

  // POST: Solo el admin (PC maestro) puede escribir
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);

      if (body.password !== ADMIN_PASSWORD) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'No autorizado' })
        };
      }

      const data = JSON.stringify({
        prompt: body.prompt,
        evolutionaryMemory: body.evolutionaryMemory,
        updatedAt: new Date().toISOString()
      });

      await store.set("master-prompt", data);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    } catch (e) {
      console.error('Error saving blob:', e);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al guardar configuración' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Método no permitido' })
  };
};
