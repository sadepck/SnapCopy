import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
};

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

const BG: Record<string, string> = {
  success: '#03624C',
  error: '#5C1A1A',
  info: '#0B453A',
};

const BORDER: Record<string, string> = {
  success: '#00DF81',
  error: '#E74C3C',
  info: '#20D295',
};

export default function Toast({ message, type = 'success', visible, onHide, duration = 2500 }: ToastProps) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 90, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: BG[type], borderLeftColor: BORDER[type] },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Feather name={ICONS[type]} size={18} color={BORDER[type]} style={{ marginRight: 10 }} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 56,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderLeftWidth: 4,
    zIndex: 9999,
    elevation: 10,
    boxShadow: '0px 4px 12px rgba(0, 15, 10, 0.25)',
  },
  text: {
    color: '#F1F2F6',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
