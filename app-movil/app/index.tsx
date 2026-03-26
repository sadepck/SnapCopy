import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';

// Llamada Directa a Gemini para personalizar el System Prompt sin tocar el backend
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState<string>('');
  const [company, setCompany] = useState<string>('');

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Se requiere acceso a la galería para seleccionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const generateCopy = async () => {
    if (!image) {
      Alert.alert('Aviso', 'Por favor selecciona o toma una foto primero.');
      return;
    }

    setLoading(true);
    setCopy('');

    try {
      // Extraemos la porción base64 quitando el prefijo de URI de data
      const base64Data = image.split(',')[1];
      
      const systemPrompt = `
Eres un analista y copywriter experto en marketing de redes sociales. Tu tarea es ayudar a vender el producto de la imagen, pero con un enfoque EXTREMADAMENTE HUMANO, empático y cercano. Nada de textos que suenen a "bot" o a vendedor de enciclopedia.

La empresa/marca para la que trabajas es: "${company || 'una marca genial y cercana'}".
Debes deducir el rubro y la personalidad de esta marca observando el producto y luego actuar como el mejor amigo del cliente ideal. Aprende de la foto para conectar emocionalmente con lo que realmente le importa a quien lo va a comprar.

Sigue esta estructura orgánica:
1. Título Gancho: Una frase genuina y cercana que atrape (usa uno o dos emojis sutiles).
2. Beneficios Conversacionales: 2 a 3 viñetas cortísimas explicando de tú a tú por qué este producto funciona o mejora la vida, en lenguaje súper natural.
3. Call to Action (CTA): Una pregunta o invitación real (ej. "¿Nos cuentas qué te parece en los comentarios?", "Toca el link en nuestra bio si necesitas uno").
4. Hashtags: 5 hashtags súper relevantes y no genéricos.

Recuerda: Si el texto suena robótico, falso o "muy publicitario", lo estamos haciendo mal. Queremos conectar genuinamente, como si hablaras con alguien en un café recomendándole tu producto favorito.
`;

      const payload = {
        contents: [{
          parts: [
            { text: systemPrompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
          ]
        }]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          setCopy(textResponse);
        } else {
          Alert.alert('Error del Servidor', 'Respuesta de la IA vacía.');
        }
      } else {
        console.error("Gemini Error:", data);
        Alert.alert('Error de IA', data.error?.message || 'Ocurrió un error al generar el copy localmente.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error de Red', 'No se pudo conectar a Gemini. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(copy);
    Alert.alert('Portapapeles', '¡El copy se ha copiado!');
  };

  const shareText = async () => {
    import('react-native').then(({ Share }) => {
      Share.share({
        message: copy,
      });
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Sin imagen seleccionada</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.buttonText}>📷 Cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.buttonText}>🖼️ Galería</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nombre de la empresa o marca (opcional)"
        placeholderTextColor="#707D7D"
        value={company}
        onChangeText={setCompany}
      />

      <TouchableOpacity 
        style={[styles.primaryButton, (!image || loading) && styles.disabledButton]} 
        onPress={generateCopy}
        disabled={!image || loading}
      >
        {loading ? (
          <ActivityIndicator color="#000F0A" size="large" />
        ) : (
          <Text style={styles.primaryButtonText}>✨ ¡Generar Copy Mágico! ✨</Text>
        )}
      </TouchableOpacity>

      {copy !== '' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>📝 Resultado:</Text>
          <View style={styles.copyBox}>
            <Text style={styles.copyText}>{copy}</Text>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
              <Text style={styles.actionButtonText}>📋 Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={shareText}>
              <Text style={styles.actionButtonText}>📤 Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F2F6',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#707D7D',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000F0A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#AACBC4',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#F1F2F6',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#03624C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#F1F2F6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#AACBC4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#000F0A',
  },
  primaryButton: {
    backgroundColor: '#00DF81',
    width: '100%',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#AACBC4',
    elevation: 0,
  },
  primaryButtonText: {
    color: '#000F0A',
    fontWeight: 'bold',
    fontSize: 18,
  },
  resultContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#20D295',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#032221',
  },
  copyBox: {
    backgroundColor: '#F1F2F6',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#178760',
    marginBottom: 20,
  },
  copyText: {
    fontSize: 16,
    color: '#000F0A',
    lineHeight: 26,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#AACBC4',
    paddingTop: 15,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#0B453A',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#20D295',
    fontWeight: 'bold',
  },
});
