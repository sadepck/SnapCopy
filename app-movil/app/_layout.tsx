import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import SplashScreen from '../components/SplashScreen';

function RootNavigator() {
  const { isAuthenticated, isLoading, transitioning } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (isLoading || showSplash || transitioning) return;

    const currentRoute = segments[0];
    if (!isAuthenticated && currentRoute !== 'auth') {
      router.replace('/auth');
    } else if (isAuthenticated && currentRoute === 'auth') {
      router.replace('/');
    }
  }, [isAuthenticated, segments, isLoading, showSplash, transitioning]);

  if (showSplash) {
    return <SplashScreen duration={1400} onFinish={() => setShowSplash(false)} />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen 
          name="auth" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'SnapCopy', 
            headerStyle: { backgroundColor: '#000F0A' }, 
            headerTintColor: '#00DF81',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontWeight: 'bold' }
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
