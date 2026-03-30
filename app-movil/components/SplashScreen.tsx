import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type SplashScreenProps = {
  onFinish?: () => void;
  duration?: number;
};

export default function SplashScreen({ onFinish, duration = 1200 }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const dotOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulso de los puntos de carga
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-cerrar
    if (onFinish) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onFinish());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.logo}>SnapCopy</Text>
        <Text style={styles.tagline}>Tu copy, al instante.</Text>
        <Animated.View style={[styles.dotsRow, { opacity: dotOpacity }]}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000F0A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#00DF81',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#AACBC4',
    fontWeight: '500',
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00DF81',
  },
});
