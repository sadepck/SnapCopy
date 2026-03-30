import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useAuth } from '../hooks/useAuth';
import { saveCopy } from '../utils/savedCopys';
import SplashScreenComponent from '../components/SplashScreen';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from '../components/Toast';

const WEB_STYLES = `
  /* === Staggered Entry === */
  @keyframes snapFadeSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .snap-stagger { opacity: 0; animation: snapFadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
  .snap-stagger-0 { animation-delay: 0.05s; }
  .snap-stagger-1 { animation-delay: 0.12s; }
  .snap-stagger-2 { animation-delay: 0.22s; }
  .snap-stagger-3 { animation-delay: 0.32s; }
  .snap-stagger-4 { animation-delay: 0.42s; }
  .snap-stagger-5 { animation-delay: 0.52s; }

  /* === Hover / Active buttons === */
  .snap-btn { transition: transform 0.15s ease, box-shadow 0.2s ease; position: relative; overflow: hidden; }
  .snap-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,15,10,0.18); }
  .snap-btn:active { transform: translateY(1px); box-shadow: 0 2px 4px rgba(0,15,10,0.12); }
  .snap-primary { transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease; position: relative; overflow: hidden; }
  .snap-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,223,129,0.3); filter: brightness(1.05); }
  .snap-primary:active { transform: translateY(1px); box-shadow: 0 2px 6px rgba(0,223,129,0.2); }
  .snap-dropzone { transition: border-color 0.25s ease, box-shadow 0.25s ease; cursor: pointer; }
  .snap-dropzone:hover { border-color: #20D295 !important; box-shadow: 0 0 0 3px rgba(32,210,149,0.12), 0 4px 16px rgba(0,15,10,0.12); }
  .snap-action { transition: transform 0.12s ease, background-color 0.15s ease; position: relative; overflow: hidden; }
  .snap-action:hover { transform: translateY(-1px); background-color: #0D5A4A; }
  .snap-action:active { transform: translateY(0px); }

  /* === Ripple Effect === */
  @keyframes snapRipple {
    from { transform: scale(0); opacity: 0.35; }
    to { transform: scale(4); opacity: 0; }
  }
  .snap-btn::after, .snap-primary::after, .snap-action::after {
    content: ''; position: absolute; top: 50%; left: 50%;
    width: 100px; height: 100px; margin: -50px 0 0 -50px;
    border-radius: 50%; background: rgba(255,255,255,0.25);
    transform: scale(0); opacity: 0; pointer-events: none;
  }
  .snap-btn:active::after, .snap-primary:active::after, .snap-action:active::after {
    animation: snapRipple 0.5s ease-out;
  }

  /* === Shimmer Skeleton === */
  @keyframes snapShimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .snap-shimmer {
    background: linear-gradient(90deg, #606a6a 25%, #7a8585 50%, #606a6a 75%);
    background-size: 800px 100%;
    animation: snapShimmer 1.6s ease-in-out infinite;
  }

  /* === Image Load Transition === */
  .snap-img-enter { animation: snapImgLand 0.4s cubic-bezier(0.22,1,0.36,1) forwards; }
  @keyframes snapImgLand {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  /* === Input focus === */
  .snap-input-wrap { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  .snap-input-wrap-focus { border-color: #20D295 !important; box-shadow: 0 0 0 3px rgba(32,210,149,0.12); }
  .snap-input { outline: none; }

  /* === Floating Label === */
  .snap-float-label {
    position: absolute; left: 44px; top: 50%; transform: translateY(-50%);
    font-size: 15px; color: #707D7D; pointer-events: none;
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
  }
  .snap-float-label-active {
    top: -8px; transform: translateY(0);
    font-size: 11px; color: #20D295; font-weight: 600;
    background: #FFFFFF; padding: 0 6px;
  }

  /* === Result slide-in === */
  .snap-result-enter { animation: snapFadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }

  /* === Dynamic shadow on content wrapper when interacting === */
  .snap-content-active { box-shadow: 0 8px 32px rgba(0,15,10,0.10); }
`;

function useWebStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const tag = document.createElement('style');
    tag.textContent = WEB_STYLES;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);
}

// Llamada Directa a Gemini para personalizar el System Prompt sin tocar el backend
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Debe coincidir con PROMPT_VERSION de admin.tsx
const PROMPT_VERSION = '2';

export default function HomeScreen() {
  useWebStyles();
  const router = useRouter();
  const { signOut, setTransitioning } = useAuth();
  const [showLogoutSplash, setShowLogoutSplash] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const adminTapCount = useRef(0);
  const adminTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  // Staggered entry animations (RN Animated for cross-platform)
  const staggerAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const staggerSlides = useRef([...Array(5)].map(() => new Animated.Value(24))).current;

  useEffect(() => {
    const anims = staggerAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim, { toValue: 1, duration: 450, delay: 80 + i * 100, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(staggerSlides[i], { toValue: 0, duration: 450, delay: 80 + i * 100, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    Animated.stagger(0, anims).start();
  }, []);


  const handleTitleTap = () => {
    adminTapCount.current += 1;
    if (adminTapTimer.current) clearTimeout(adminTapTimer.current);
    if (adminTapCount.current >= 5) {
      adminTapCount.current = 0;
      router.push('/admin' as any);
      return;
    }
    adminTapTimer.current = setTimeout(() => {
      adminTapCount.current = 0;
    }, 1500);
  };

  const doLogout = async () => {
    setTransitioning(true);
    await signOut();
    setShowLogoutSplash(true);
  };

  const handleLogout = () => {
    doLogout();
  };

  const handleLogoutSplashFinish = () => {
    setShowLogoutSplash(false);
    setTransitioning(false);
    router.replace('/auth');
  };
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copies, setCopies] = useState<string[]>([]);
  const [company, setCompany] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const [evolutionaryMemoryEnabled, setEvolutionaryMemoryEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          const savedHistory = await AsyncStorage.getItem('learningHistory');
          if (savedHistory) setHistory(JSON.parse(savedHistory));

          // Intentar obtener el prompt maestro del cloud (cerebro del PC admin)
          let cloudLoaded = false;
          try {
            const res = await fetch('/.netlify/functions/master-prompt');
            if (res.ok) {
              const cloud = await res.json();
              if (cloud.prompt) {
                setCustomPrompt(cloud.prompt);
                await AsyncStorage.setItem('customSystemPrompt', cloud.prompt);
                if (cloud.evolutionaryMemory !== undefined) {
                  setEvolutionaryMemoryEnabled(cloud.evolutionaryMemory);
                  await AsyncStorage.setItem('evolutionaryMemoryEnabled', cloud.evolutionaryMemory.toString());
                }
                cloudLoaded = true;
              }
            }
          } catch (networkErr) {
            console.log('Cloud no disponible, usando cache local');
          }

          // Fallback: si no se pudo cargar del cloud, usar cache local o default
          if (!cloudLoaded) {
            const savedVersion = await AsyncStorage.getItem('promptVersion');
            if (savedVersion !== PROMPT_VERSION) {
              await AsyncStorage.removeItem('customSystemPrompt');
              await AsyncStorage.setItem('promptVersion', PROMPT_VERSION);
              setCustomPrompt(null);
            } else {
              const savedPrompt = await AsyncStorage.getItem('customSystemPrompt');
              if (savedPrompt) setCustomPrompt(savedPrompt);
            }
            
            const memoryConf = await AsyncStorage.getItem('evolutionaryMemoryEnabled');
            if (memoryConf !== null) setEvolutionaryMemoryEnabled(memoryConf === 'true');
          }
        } catch (e) {
          console.error('Error loading settings:', e);
        }
      };
      loadSettings();
    }, [])
  );

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
      setImages(prev => {
        if (prev.length >= 5) { showToast('Máximo 5 imágenes', 'info'); return prev; }
        return [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`];
      });
      showToast('Imagen capturada con éxito', 'success');
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
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets
        .filter(a => a.base64)
        .map(a => `data:image/jpeg;base64,${a.base64}`);
      setImages(prev => {
        const combined = [...prev, ...newImages].slice(0, 5);
        return combined;
      });
      showToast(`${newImages.length} imagen(es) cargada(s)`, 'success');
    }
  };

  const generateCopyForImage = async (img: string, systemPrompt: string): Promise<string | null> => {
    const base64Data = img.split(',')[1];
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok) {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } else {
      console.error('Gemini Error:', data);
      return null;
    }
  };

  const generateCopy = async () => {
    if (images.length === 0) {
      Alert.alert('Aviso', 'Por favor selecciona o toma al menos una foto.');
      return;
    }

    setLoading(true);
    setCopies([]);

    try {
      const historyBlock = (evolutionaryMemoryEnabled && history.length > 0)
        ? `\n\n[MEMORIA EN TU CEREBRO]\nAquí tienes tus respuestas anteriores guardadas en tu memoria. Analízalas para aprender y evolucionar. Tu objetivo es NO repetir las mismas frases, sino mejorar en cada iteración para volverte cada vez MÁS HUMANO, empático y persuasivo. Supera estas respuestas anteriores:\n${history.map((h, i) => `--- Memoria ${i+1} ---\n${h}`).join('\n\n')}\n[/MEMORIA EN TU CEREBRO]\n`
        : '';

      const defaultSystemPrompt = `Eres un experto en creación de contenido viral para redes sociales. Vas a analizar visualmente el producto de la imagen de la marca '{company}'. Para cada solicitud, genera ÚNICAMENTE:

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

      let finalPrompt = customPrompt || defaultSystemPrompt;
      finalPrompt = finalPrompt.replace('{company}', company || 'una marca genial y cercana');
      finalPrompt = finalPrompt.replace('{historyBlock}', historyBlock);

      const results = await Promise.all(
        images.map(img => generateCopyForImage(img, finalPrompt))
      );

      const validResults = results.filter((r): r is string => r !== null);
      if (validResults.length > 0) {
        setCopies(validResults);
        const newHistory = [...validResults, ...history].slice(0, 5);
        setHistory(newHistory);
        AsyncStorage.setItem('learningHistory', JSON.stringify(newHistory)).catch(e => console.error(e));
        showToast(`${validResults.length} copy(s) generado(s)`, 'success');
      } else {
        Alert.alert('Error', 'No se pudo generar ningún copy.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error de Red', 'No se pudo conectar a Gemini. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showToast('¡Copiado al portapapeles!', 'success');
  };

  const shareText = async (text: string) => {
    import('react-native').then(({ Share }) => {
      Share.share({ message: text });
    });
  };

  const compressForStorage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => resolve(dataUri);
      img.src = dataUri;
    });
  };

  const handleSave = async (imgIndex: number, copyText: string) => {
    const img = images[imgIndex];
    if (!img || !copyText) return;
    try {
      let imageToStore = img;

      if (Platform.OS === 'web') {
        // Compress image to small thumbnail for localStorage
        imageToStore = await compressForStorage(img);
      } else {
        // Save image file and store URI instead of huge base64
        const filename = `${FileSystem.documentDirectory}snapcopy_${Date.now()}.jpg`;
        const base64Data = img.split(',')[1];
        await FileSystem.writeAsStringAsync(filename, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageToStore = filename;

        // Also save to gallery
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(filename);
          }
        } catch (galleryErr) {
          console.warn('No se pudo guardar en galería:', galleryErr);
        }
      }

      await saveCopy({ image: imageToStore, copyText, company });
      showToast('¡Guardado exitosamente!', 'success');
    } catch (e) {
      console.error('Error al guardar:', e);
      showToast('Error al guardar', 'error');
    }
  };

  if (showLogoutSplash) {
    return <SplashScreenComponent duration={1200} onFinish={handleLogoutSplashFinish} />;
  }

  const webProps = (className: string) =>
    Platform.OS === 'web' ? { dataSet: { class: className } } as any : {};

  const staggerStyle = (index: number) => ({
    opacity: staggerAnims[index],
    transform: [{ translateY: staggerSlides[index] }],
  });

  const floatingLabelActive = inputFocused || company.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Stack.Screen
          options={{
            headerTitle: () => (
              <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
                <Text style={{ color: '#00DF81', fontWeight: 'bold', fontSize: 18 }}>SnapCopy</Text>
              </TouchableOpacity>
            ),
            headerLeft: () => (
              <TouchableOpacity onPress={handleLogout} style={styles.headerLogout}>
                <Feather name="log-out" size={16} color="#00DF81" style={{ marginRight: 6 }} />
                <Text style={styles.headerLogoutText}>Salir</Text>
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push('/history' as any)} style={styles.headerHistory}>
                <Feather name="archive" size={18} color="#00DF81" />
              </TouchableOpacity>
            ),
          }}
        />

        {images.length > 0 ? (
          <View style={styles.thumbGrid}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.thumbWrapper}>
                <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.thumbRemove}
                  onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                >
                  <Feather name="x" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.thumbBadge}>
                  <Text style={styles.thumbBadgeText}>{idx + 1}</Text>
                </View>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.thumbAdd} onPress={pickImage} activeOpacity={0.8}>
                <Feather name="plus" size={28} color="#AACBC4" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <TouchableOpacity style={styles.placeholderTouchable} onPress={pickImage} activeOpacity={0.85}>
              <View style={styles.placeholderIconCircle}>
                <Feather name="upload-cloud" size={36} color="#AACBC4" />
              </View>
              <Text style={styles.placeholderTitle}>Toca para subir imágenes</Text>
              <Text style={styles.placeholderSub}>Hasta 5 imágenes — JPG, PNG</Text>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View style={[styles.buttonRow, staggerStyle(1)]}>
          <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto} activeOpacity={0.8} {...webProps('snap-btn')}>
            <Ionicons name="camera-outline" size={20} color="#F1F2F6" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={pickImage} activeOpacity={0.8} {...webProps('snap-btn')}>
            <Ionicons name="images-outline" size={20} color="#F1F2F6" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Galería</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, staggerStyle(2)]}>
          <View
            style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused]}
            {...webProps(`snap-input-wrap${inputFocused ? ' snap-input-wrap-focus' : ''}`)}
          >
            <Feather name="tag" size={18} color={inputFocused ? '#20D295' : '#AACBC4'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={floatingLabelActive ? '' : 'Nombre de la empresa o marca (opcional)'}
              placeholderTextColor="#707D7D"
              value={company}
              onChangeText={setCompany}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              {...webProps('snap-input')}
            />
            {Platform.OS === 'web' && (
              <Text
                style={styles.floatingLabelNative}
                {...webProps(`snap-float-label${floatingLabelActive ? ' snap-float-label-active' : ''}`)}
              >
                Empresa o marca (opcional)
              </Text>
            )}
            {Platform.OS !== 'web' && floatingLabelActive && (
              <Text style={styles.floatingLabelNative}>Empresa o marca (opcional)</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, staggerStyle(3)]}>
          <TouchableOpacity
            style={[styles.primaryButton, (images.length === 0 || loading) && styles.disabledButton]}
            onPress={generateCopy}
            disabled={images.length === 0 || loading}
            activeOpacity={0.85}
            {...webProps('snap-primary')}
          >
            {loading ? (
              <View style={styles.primaryButtonInner}>
                <ActivityIndicator color="#000F0A" size="small" />
                <Text style={[styles.primaryButtonText, { marginLeft: 10 }]}>Generando...</Text>
              </View>
            ) : (
              <View style={styles.primaryButtonInner}>
                <MaterialCommunityIcons name="creation" size={22} color="#000F0A" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>¡Generar Copy Mágico!</Text>
                <MaterialCommunityIcons name="creation" size={22} color="#000F0A" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {copies.length > 0 && copies.map((copyText, idx) => (
          <Animated.View key={idx} style={[{ width: '100%', marginBottom: 16 }, staggerStyle(4)]} {...webProps('snap-result-enter')}>
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                {images[idx] && (
                  <Image source={{ uri: images[idx] }} style={styles.resultThumb} resizeMode="cover" />
                )}
                <Feather name="file-text" size={20} color="#032221" style={{ marginRight: 8 }} />
                <Text style={styles.resultTitle}>Imagen {idx + 1}</Text>
              </View>
              <View style={styles.copyBox}>
                <Text style={styles.copyText}>{copyText}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => copyToClipboard(copyText)} activeOpacity={0.8} {...webProps('snap-action')}>
                  <Feather name="clipboard" size={16} color="#20D295" style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => shareText(copyText)} activeOpacity={0.8} {...webProps('snap-action')}>
                  <Feather name="share-2" size={16} color="#20D295" style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Compartir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={() => handleSave(idx, copyText)} activeOpacity={0.8}>
                  <Feather name="download" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
    </View>
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
    paddingBottom: 48,
  },
  /* Header */
  headerLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerLogoutText: {
    fontSize: 14,
    color: '#00DF81',
    fontWeight: '600',
  },
  headerGear: {
    marginRight: 15,
    padding: 4,
  },
  headerHistory: {
    marginRight: 15,
    padding: 6,
  },
  /* Image Preview / Drop Zone */
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
    boxShadow: '0px 2px 4px rgba(0, 15, 10, 0.2)',
    borderWidth: 1,
    borderColor: '#AACBC4',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  thumbWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#AACBC4',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#03624C',
    borderRadius: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  thumbAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#AACBC4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(170,203,196,0.1)',
  },
  placeholderTouchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  placeholderIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(241,242,246,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  placeholderTitle: {
    color: '#F1F2F6',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  placeholderSub: {
    color: '#AACBC4',
    fontSize: 13,
    fontWeight: '400',
  },
  shimmerBox: {
    width: '100%',
    height: '100%',
  },
  /* Action Buttons */
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#03624C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    boxShadow: '0px 2px 6px rgba(0, 15, 10, 0.12)',
  },
  buttonText: {
    color: '#F1F2F6',
    fontWeight: '700',
    fontSize: 15,
  },
  /* Input */
  inputWrapper: {
    position: 'relative',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#AACBC4',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 14,
    boxShadow: '0px 1px 4px rgba(0, 15, 10, 0.04)',
    elevation: 1,
  },
  inputWrapperFocused: {
    borderColor: '#20D295',
    boxShadow: '0px 0px 8px rgba(32, 210, 149, 0.1)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: '#000F0A',
  },
  floatingLabelNative: {
    position: 'absolute',
    left: 44,
    top: -8,
    fontSize: 11,
    color: '#20D295',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
  },
  /* Primary Button */
  primaryButton: {
    backgroundColor: '#00DF81',
    width: '100%',
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    elevation: 4,
    boxShadow: '0px 4px 10px rgba(0, 223, 129, 0.25)',
  },
  disabledButton: {
    backgroundColor: '#AACBC4',
    elevation: 0,
    boxShadow: 'none',
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#000F0A',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  /* Result */
  resultContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#20D295',
    boxShadow: '0px 4px 16px rgba(0, 15, 10, 0.08)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#AACBC4',
  },
  resultTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#032221',
  },
  copyBox: {
    backgroundColor: '#F1F2F6',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#178760',
    marginBottom: 20,
  },
  copyText: {
    fontSize: 15,
    color: '#000F0A',
    lineHeight: 26,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#AACBC4',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#0B453A',
  },
  actionButtonText: {
    fontSize: 15,
    color: '#20D295',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#00DF81',
  },
});
