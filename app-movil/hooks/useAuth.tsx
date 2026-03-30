import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  transitioning: boolean;
  setTransitioning: (val: boolean) => void;
  signIn: (session: { email: string; name: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  transitioning: false,
  setTransitioning: () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await AsyncStorage.getItem('snapcopy_session');
        setIsAuthenticated(!!session);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const signIn = async (session: { email: string; name: string }) => {
    await AsyncStorage.setItem('snapcopy_session', JSON.stringify(session));
    setIsAuthenticated(true);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('snapcopy_session');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, transitioning, setTransitioning, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
