// api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';

// Configuración inicial
// En web usa localhost, en móvil usa la IP local de la red
const getBaseURL = () => {
  const platform = Platform.OS;
  console.log('🔍 Plataforma detectada:', platform);

  if (platform === 'web') {
    const url = 'http://localhost:8000';
    console.log('✅ Usando URL para web:', url);
    return url;
  }

  const url = 'http://192.168.0.155:8000';
  console.log('📱 Usando URL para móvil:', url);
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  withCredentials: Platform.OS !== 'web', // Deshabilitar en web por CORS
});

// Log inicial
console.log('🚀 API inicializada con baseURL:', api.defaults.baseURL);

type QueueItem = {
  resolve: (value: unknown) => void;
  reject: (error: AxiosError) => void;
  config: InternalAxiosRequestConfig;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: AxiosError | null, token?: string) => {
  failedQueue.forEach(({ config, resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(api(config));
    }
  });
  failedQueue = [];
};

// Interceptor de solicitud
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // En React Native no podemos enviar cookies automáticamente como en un navegador
    // Por eso usamos los tokens almacenados

    // Las solicitudes a silent-renew y algunos endpoints específicos necesitan el refresh_token
    if (config.url === '/silent-renew' || config.url === '/refresh-token') {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        // En React Native necesitamos simular las cookies del navegador
        config.headers = config.headers || {};
        // Añadir como cookie en el header
        config.headers.Cookie = `refresh_token=Bearer ${refreshToken}`;
      }
    } else {
      // Para el resto de solicitudes, usar el token de acceso
      const accessToken = await AsyncStorage.getItem('access_token');
      if (accessToken) {
        config.headers = config.headers || {};
        // Implementación dual para compatibilidad con el backend
        config.headers.Authorization = `Bearer ${accessToken}`;
        // También enviar como cookie para endpoints que esperan cookies
        config.headers.Cookie = `access_token=Bearer ${accessToken}`;
      }
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor de respuesta
api.interceptors.response.use(
  (response) => {
    // Intentar extraer tokens de las headers si están disponibles
    extractAndSaveTokens(response);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Si no es error de autenticación o ya intentamos el retry, rechazar
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Marcar como retry para evitar loops infinitos
    originalRequest._retry = true;

    // Si ya estamos refrescando, añadir a la cola
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ config: originalRequest, resolve, reject });
      });
    }

    isRefreshing = true;

    try {
      // Intenta hacer el silent-renew
      const response = await api.post('/silent-renew');
      
      // Extraer tokens de la respuesta
      const { access_token, refresh_token } = response.data;
      
      if (access_token && refresh_token) {
        await AsyncStorage.multiSet([
          ['access_token', access_token],
          ['refresh_token', refresh_token]
        ]);
      }

      // Procesar cola de solicitudes pendientes
      processQueue(null, access_token);
      
      // Reintentar la solicitud original
      return api(originalRequest);
    } catch (refreshError) {
      // Limpiar tokens y navegar a Login
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      
      // Navegar a Login (requiere inyección de navigation)
      if (navigationRef?.isReady()) {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
        
        Alert.alert(
          'Sesión expirada',
          'Tu sesión ha caducado, por favor inicia sesión nuevamente',
          [{ text: 'OK', onPress: () => {} }]
        );
      }
      
      processQueue(error as AxiosError);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

// Función para extraer tokens de la respuesta
const extractAndSaveTokens = async (response: AxiosResponse) => {
  try {
    // Intentar extraer tokens del cuerpo de la respuesta
    const { access_token, refresh_token } = response.data || {};
    
    if (access_token && refresh_token) {
      await AsyncStorage.multiSet([
        ['access_token', access_token],
        ['refresh_token', refresh_token]
      ]);
    }
    
    // Si estamos en React Native, las cookies no se manejan automáticamente
    // Si hay cookies en las headers, extraerlas y guardarlas
    const cookies = response.headers['set-cookie'];
    if (cookies && Array.isArray(cookies)) {
      cookies.forEach(async (cookie) => {
        if (cookie.includes('access_token=')) {
          const match = cookie.match(/access_token=([^;]+)/);
          if (match && match[1]) {
            await AsyncStorage.setItem('access_token', match[1].replace('Bearer ', ''));
          }
        }
        if (cookie.includes('refresh_token=')) {
          const match = cookie.match(/refresh_token=([^;]+)/);
          if (match && match[1]) {
            await AsyncStorage.setItem('refresh_token', match[1].replace('Bearer ', ''));
          }
        }
      });
    }
  } catch (error) {
    console.error('Error extracting tokens:', error);
  }
};

// Configurar referencia de navegación
let navigationRef: any;
export const setNavigation = (nav: any) => {
  navigationRef = nav;
};

export default api;