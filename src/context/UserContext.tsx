// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';

interface UserData {
  nombre: string;
  apellido: string;
  rol: string;
  foto: string;
  email?: string;
  idrol?: number;
}

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  errorMessage: string;
  alertCount: number;
  refreshUserData: () => Promise<void>;
  clearUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userData: null,
  loading: true,
  errorMessage: '',
  alertCount: 0,
  refreshUserData: async () => {},
  clearUserData: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [alertCount, setAlertCount] = useState(0);

  const loadFromStorage = async (): Promise<UserData | null> => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const localUser = JSON.parse(userString);
        if (localUser.nombre && localUser.apellido) {
          return {
            nombre: localUser.nombre,
            apellido: localUser.apellido,
            rol: localUser.idrol === 1 ? 'Administrador' : 'Usuario',
            foto: localUser.foto || 'https://via.placeholder.com/150',
            email: localUser.email,
            idrol: localUser.idrol
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  };

  const fetchFromServer = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');

      // Obtener perfil
      const profileResponse = await api.get('/perfil', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      const userProfile = profileResponse.data.user || profileResponse.data;
      if (!userProfile.nombre) throw new Error('Datos de perfil inválidos');

      // Construir objeto usuario
      const newUserData = {
        nombre: userProfile.nombre,
        apellido: userProfile.apellido || '',
        rol: userProfile.idrol === 1 ? 'Administrador' : 'Usuario',
        foto: userProfile.foto || 'https://via.placeholder.com/150',
        email: userProfile.email,
        idrol: userProfile.idrol
      };

      // Actualizar AsyncStorage
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(newUserData)],
        ['lastUpdate', new Date().getTime().toString()]
      ]);

      setUserData(newUserData);
      setErrorMessage('');

      // Obtener alertas
      const alertsResponse = await api.get('/alertas/pendientes', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setAlertCount(alertsResponse.data.count || 0);
      return true;
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      
      let errorMsg = 'Error cargando datos';
      if (error.response) {
        errorMsg = error.response.data?.message || `Error ${error.response.status}`;
      } else if (error.message.includes('token')) {
        errorMsg = 'Sesión expirada';
      }
      
      setErrorMessage(errorMsg);
      
      // Limpiar datos si es error de autenticación
      if (error.response?.status === 401) {
        await clearUserData();
      }
      return false;
    }
  };

  const refreshUserData = useCallback(async () => {
    setLoading(true);
    await fetchFromServer();
    setLoading(false);
  }, []);

  const clearUserData = useCallback(async () => {
    await AsyncStorage.multiRemove(['access_token', 'user', 'lastUpdate']);
    setUserData(null);
  }, []);

  const initializeUserData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      // 1. Primero intentar cargar desde AsyncStorage
      const localUser = await loadFromStorage();
      if (localUser) {
        setUserData(localUser);
        
        // Verificar si necesitamos actualizar datos
        const lastUpdate = await AsyncStorage.getItem('lastUpdate');
        const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
        if (!lastUpdate || parseInt(lastUpdate) < oneDayAgo) {
          // Actualizar en segundo plano
          fetchFromServer();
        }
      } else {
        // 2. Si no hay datos locales válidos, cargar desde servidor
        await fetchFromServer();
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
      setErrorMessage('Error inicializando datos de usuario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeUserData();
  }, []);

  const value = {
    userData,
    loading,
    errorMessage,
    alertCount,
    refreshUserData,
    clearUserData
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};