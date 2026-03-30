import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Contraseña maestra (de .env o por defecto)
const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || 'admin123';

// Subir este número cada vez que se actualice el defaultPrompt para forzar sync en todos los dispositivos
const PROMPT_VERSION = '2';

const defaultPrompt = `Eres un experto en creación de contenido viral para redes sociales. Vas a analizar visualmente el producto de la imagen de la marca '{company}'. Para cada solicitud, genera ÚNICAMENTE:

1. **Título**: Corto, impactante y optimizado para captar atención (máx. 10 palabras).
2. **Enganche (Hook)**: Una frase inicial que detenga el scroll del usuario (pregunta, dato impactante o controversia).
3. **Descripción**: Texto breve, directo y persuasivo que desarrolle la idea (máx. 3 oraciones).
4. **Hashtags**: 5-8 hashtags relevantes mezclando alto volumen y nicho.

REGLA DE EVOLUCIÓN (aplícala internamente, NO la muestres en la respuesta):
- En la 1ª versión: entrega una base sólida y funcional.
- En la 2ª versión: mejora el copywriting, intensifica el enganche y ajusta el tono emocional.
- En la 3ª versión: optimiza para viralidad, añade urgencia o exclusividad y refina los hashtags.
- En cada versión posterior: sigue elevando la calidad aplicando técnicas avanzadas de persuasión, storytelling y tendencias actuales.

Formato de salida (ESTRICTO, no agregues nada más):
📍 Título: ...
🔥 Enganche: ...
📝 Descripción: ...
#️⃣ Hashtags: ...

Sé breve, preciso y directo. No rellenes con texto innecesario. No incluyas notas, explicaciones ni mejoras aplicadas. Solo entrega el copy listo para publicar. Optimizado para Instagram y Facebook Marketplace.
{historyBlock}`;

export default function AdminScreen() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [evolutionaryMemory, setEvolutionaryMemory] = useState(true);
  const [adminPass, setAdminPass] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      const savedVersion = await AsyncStorage.getItem('promptVersion');
      const savedPrompt = await AsyncStorage.getItem('customSystemPrompt');

      if (savedVersion !== PROMPT_VERSION) {
        // Versión nueva: forzar el default actualizado en este dispositivo
        setCustomPrompt(defaultPrompt);
        await AsyncStorage.setItem('customSystemPrompt', defaultPrompt);
        await AsyncStorage.setItem('promptVersion', PROMPT_VERSION);
      } else if (savedPrompt) {
        setCustomPrompt(savedPrompt);
      } else {
        setCustomPrompt(defaultPrompt);
      }
      
      const savedMemoryConf = await AsyncStorage.getItem('evolutionaryMemoryEnabled');
      if (savedMemoryConf !== null) {
        setEvolutionaryMemory(savedMemoryConf === 'true');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const syncToCloud = async () => {
    try {
      const res = await fetch('/.netlify/functions/master-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPass,
          prompt: customPrompt,
          evolutionaryMemory,
        }),
      });
      return res.ok;
    } catch (e) {
      console.error('Error sincronizando al cloud:', e);
      return false;
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('customSystemPrompt', customPrompt);
      await AsyncStorage.setItem('promptVersion', PROMPT_VERSION);
      await AsyncStorage.setItem('evolutionaryMemoryEnabled', evolutionaryMemory.toString());

      const synced = await syncToCloud();
      if (synced) {
        Alert.alert('Guardado', 'Configuración de IA actualizada en TODOS los dispositivos.');
      } else {
        Alert.alert('Guardado local', 'Se guardó en este dispositivo, pero no se pudo sincronizar con los demás. Intenta de nuevo.');
      }
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se guardaron los cambios.');
    }
  };

  const wipeMemory = async () => {
    Alert.alert(
      'Amnesia',
      '¿Estás seguro de que quieres borrar el historial de aprendizaje de la IA?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, borrar', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('learningHistory');
            Alert.alert('Borrador', 'La memoria evolutiva se ha limpiado por completo.');
          }
        }
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', padding: 30 }]}>
        <Text style={styles.title}>🔒 Acceso Administrador</Text>
        <Text style={styles.subtitle}>Ingresa tu contraseña maestra para configurar la IA</Text>
        
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Contraseña..."
          placeholderTextColor="#707D7D"
          value={passwordInput}
          onChangeText={setPasswordInput}
        />
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            if (passwordInput === ADMIN_PASSWORD) {
              setAdminPass(passwordInput);
              setIsAuthenticated(true);
            } else {
              Alert.alert('Error', 'Contraseña incorrecta');
              setPasswordInput('');
            }
          }}
        >
          <Text style={styles.primaryButtonText}>Entrar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{marginTop: 20, alignItems: 'center'}} onPress={() => router.back()}>
          <Text style={{color: '#03624C', fontSize: 16}}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>⚙️ Configuración Maestra de IA</Text>
      
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Memoria Evolutiva</Text>
          <Switch 
            value={evolutionaryMemory} 
            onValueChange={setEvolutionaryMemory}
            trackColor={{ false: '#707D7D', true: '#20D295' }}
            thumbColor={evolutionaryMemory ? '#00DF81' : '#F1F2F6'}
          />
        </View>
        <Text style={styles.helpText}>Permite que la IA analice sus copies anteriores para mejorar constantemente su propio estilo y reducir repeticiones.</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>System Prompt Base (Reglas de la IA)</Text>
        <Text style={styles.helpText}>Usa {"{company}"} para inyectar el nombre de la empresa y {"{historyBlock}"} donde quieras colocar la memoria. Modifica bajo tu propio riesgo.</Text>
        
        <TextInput
          style={styles.textArea}
          multiline
          textAlignVertical="top"
          value={customPrompt}
          onChangeText={setCustomPrompt}
        />
        
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setCustomPrompt(defaultPrompt)}>
          <Text style={styles.secondaryButtonText}>Restaurar Prompt por Defecto</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dangerButton} onPress={wipeMemory}>
        <Text style={styles.dangerButtonText}>🧠 Aplicar Amnesia (Borrar Aprendizaje)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={saveSettings}>
        <Text style={styles.primaryButtonText}>💾 Guardar y Aplicar</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000F0A',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#03624C',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#AACBC4',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000F0A',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 14,
    color: '#707D7D',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#AACBC4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#000F0A',
  },
  textArea: {
    backgroundColor: '#F1F2F6',
    borderWidth: 1,
    borderColor: '#AACBC4',
    padding: 12,
    borderRadius: 8,
    height: 300,
    fontSize: 14,
    color: '#000F0A',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#00DF81',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  primaryButtonText: {
    color: '#000F0A',
    fontWeight: 'bold',
    fontSize: 18,
  },
  secondaryButton: {
    backgroundColor: '#03624C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F1F2F6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E74C3C',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  dangerButtonText: {
    color: '#E74C3C',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
