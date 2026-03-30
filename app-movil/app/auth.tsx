import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import SplashScreen from '../components/SplashScreen';

type Tab = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, setTransitioning } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [showSplash, setShowSplash] = useState(false);
  const [splashDuration, setSplashDuration] = useState(900);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');

  const showSplashThen = useCallback((action: () => void, duration = 900, lockRedirect = false) => {
    if (lockRedirect) setTransitioning(true);
    setPendingAction(() => action);
    setSplashDuration(duration);
    setShowSplash(true);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    setTransitioning(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return;
    showSplashThen(() => setActiveTab(tab), 800);
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Alert.alert('Campos vacíos', 'Por favor completa todos los campos.');
      return;
    }
    try {
      const usersRaw = await AsyncStorage.getItem('snapcopy_users');
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const user = users.find(
        (u: any) => u.email === loginEmail.trim().toLowerCase() && u.password === loginPassword
      );
      if (!user) {
        Alert.alert('Error', 'Email o contraseña incorrectos.');
        return;
      }
      setTransitioning(true);
      await signIn({ email: user.email, name: user.name });
      showSplashThen(() => router.replace('/'), 1200, true);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo iniciar sesión.');
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim() || !registerConfirm.trim()) {
      Alert.alert('Campos vacíos', 'Por favor completa todos los campos.');
      return;
    }
    if (registerPassword !== registerConfirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (registerPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      const usersRaw = await AsyncStorage.getItem('snapcopy_users');
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const exists = users.find((u: any) => u.email === registerEmail.trim().toLowerCase());
      if (exists) {
        Alert.alert('Error', 'Ya existe una cuenta con ese email.');
        return;
      }
      const newUser = {
        name: registerName.trim(),
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
      };
      users.push(newUser);
      await AsyncStorage.setItem('snapcopy_users', JSON.stringify(users));
      setTransitioning(true);
      await signIn({ email: newUser.email, name: newUser.name });
      showSplashThen(() => router.replace('/'), 1200, true);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo crear la cuenta.');
    }
  };

  if (showSplash) {
    return <SplashScreen duration={splashDuration} onFinish={handleSplashFinish} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>SnapCopy</Text>
          <Text style={styles.welcome}>¡Bienvenido a SnapCopy!</Text>
          <Text style={styles.subtitle}>Accede para sincronizar tus portapapeles.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity style={styles.tab} onPress={() => switchTab('login')} activeOpacity={0.7}>
              <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>Entrar</Text>
              {activeTab === 'login' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => switchTab('register')} activeOpacity={0.7}>
              <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>Crear Cuenta</Text>
              {activeTab === 'register' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Login */}
          {activeTab === 'login' && (
            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor="#707D7D"
                keyboardType="email-address"
                autoCapitalize="none"
                value={loginEmail}
                onChangeText={setLoginEmail}
              />
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu contraseña"
                placeholderTextColor="#707D7D"
                secureTextEntry
                value={loginPassword}
                onChangeText={setLoginPassword}
              />
              <TouchableOpacity style={styles.forgotRow}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Snap In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Register */}
          {activeTab === 'register' && (
            <View style={styles.form}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor="#707D7D"
                value={registerName}
                onChangeText={setRegisterName}
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor="#707D7D"
                keyboardType="email-address"
                autoCapitalize="none"
                value={registerEmail}
                onChangeText={setRegisterEmail}
              />
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#707D7D"
                secureTextEntry
                value={registerPassword}
                onChangeText={setRegisterPassword}
              />
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#707D7D"
                secureTextEntry
                value={registerConfirm}
                onChangeText={setRegisterConfirm}
              />
              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Empezar a Copiar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PRIMARY = '#00DF81';
const PRIMARY_DARK = '#03624C';
const DARK = '#000F0A';
const ACCENT = '#20D295';
const BORDER = '#AACBC4';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F2F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 1,
    marginBottom: 6,
  },
  welcome: {
    fontSize: 21,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#707D7D',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#707D7D',
  },
  tabTextActive: {
    color: PRIMARY_DARK,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#032221',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F2F6',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: DARK,
    marginBottom: 16,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 13,
    color: PRIMARY_DARK,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: DARK,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
