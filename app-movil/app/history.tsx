import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Feather } from '@expo/vector-icons';
import { getSavedCopys, deleteSavedCopy, SavedCopy } from '../utils/savedCopys';

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SavedCopy[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    const saved = await getSavedCopys();
    setItems(saved);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Estás seguro de que quieres eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteSavedCopy(id);
          loadItems();
        },
      },
    ]);
  };

  const handleCopyText = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', '¡Texto copiado al portapapeles!');
  };

  const handleSaveToGallery = async (imageUri: string) => {
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = imageUri;
        link.download = `snapcopy_${Date.now()}.jpg`;
        link.click();
        Alert.alert('Descargado', 'Imagen descargada.');
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se requiere acceso a la galería para guardar fotos.');
        return;
      }

      const filename = `${FileSystem.cacheDirectory}snapcopy_${Date.now()}.jpg`;
      const base64Data = imageUri.split(',')[1];
      await FileSystem.writeAsStringAsync(filename, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await MediaLibrary.saveToLibraryAsync(filename);
      Alert.alert('Guardado', '¡Imagen guardada en tu galería!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la imagen.');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Stack.Screen
          options={{
            title: 'Mis Copys Guardados',
            headerStyle: { backgroundColor: '#000F0A' },
            headerTintColor: '#00DF81',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color="#AACBC4" />
            <Text style={styles.emptyTitle}>Sin registros guardados</Text>
            <Text style={styles.emptySub}>Genera un copy y guárdalo para verlo aquí.</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.cardBody}>
                {item.company ? (
                  <Text style={styles.cardCompany}>{item.company}</Text>
                ) : null}
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.cardText} numberOfLines={6}>{item.copyText}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleCopyText(item.copyText)}>
                    <Feather name="clipboard" size={14} color="#20D295" />
                    <Text style={styles.actionText}>Copiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleSaveToGallery(item.image)}>
                    <Feather name="download" size={14} color="#20D295" />
                    <Text style={styles.actionText}>Galería</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                    <Feather name="trash-2" size={14} color="#E74C3C" />
                    <Text style={[styles.actionText, { color: '#E74C3C' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F2F6',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000F0A',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#707D7D',
    marginTop: 6,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#03624C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#F1F2F6',
    fontWeight: '700',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#AACBC4',
    elevation: 2,
    shadowColor: '#000F0A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: 14,
  },
  cardCompany: {
    fontSize: 13,
    fontWeight: '700',
    color: '#03624C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#707D7D',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#000F0A',
    lineHeight: 22,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#AACBC4',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0B453A',
  },
  deleteBtn: {
    backgroundColor: '#FFF0F0',
    marginLeft: 'auto',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#20D295',
  },
});
