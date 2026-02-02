// src/presentation/layouts/MainLayout.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, PanResponder, ActivityIndicator, TouchableOpacity, Text, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AlertNotifications from '../components/AlertNotifications';
import api from '../../../api';

interface UserData {
  nombre: string;
  apellido: string;
  rol: string;
  foto: string;
  email?: string;
}

interface Alerta {
  id: number;
  mensaje: string;
  estado: string;
  parametro_afectado: string;
  fecha_generacion: string;
  id_producto_monitoreado: number;
  valor_medido: number;
  limite_min: number;
  limite_max: number;
}

interface ProductoMonitoreado {
  id: number;
  localizacion: string;
  foto_producto: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  loading?: boolean;
  refreshUserData?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  loading: externalLoading,
  refreshUserData = false
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [productos, setProductos] = useState<ProductoMonitoreado[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Animación del sidebar
  const sidebarTranslateX = useRef(new Animated.Value(-320)).current; // -320 es el ancho del sidebar
  const abortController = useRef(new AbortController());

  const loadFromStorage = async () => {
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
            email: localUser.email
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      abortController.current = new AbortController();

      // 1. Primero intentar cargar desde AsyncStorage
      const localUser = await loadFromStorage();
      if (localUser && !refreshUserData) {
        setUserData(localUser);
        
        // Cargar alertas y productos aunque haya datos locales
        await fetchAlertasAndProductos();
        return;
      }

      // 2. Si no hay datos locales válidos o se solicita refresco, cargar desde servidor
      await fetchFromServer();
      
    } catch (error: any) {
      handleFetchError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFromServer = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');

      // Obtener perfil
      const profileResponse = await api.get('/perfil', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        signal: abortController.current.signal
      });

      const userProfile = profileResponse.data.user || profileResponse.data;
      if (!userProfile.nombre) throw new Error('Datos de perfil inválidos');

      // Construir objeto usuario
      const newUserData = {
        nombre: userProfile.nombre,
        apellido: userProfile.apellido || '',
        rol: userProfile.idrol === 1 ? 'Administrador' : 'Usuario',
        foto: userProfile.foto || 'https://via.placeholder.com/150',
        email: userProfile.email
      };

      // Actualizar AsyncStorage
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(newUserData)],
        ['lastUpdate', new Date().getTime().toString()]
      ]);

      setUserData(newUserData);

      // Cargar alertas y productos
      await fetchAlertasAndProductos();
    } catch (error: any) {
      handleFetchError(error);
      
      // Limpiar datos si es error de autenticación
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['access_token', 'user', 'lastUpdate']);
      }
      throw error;
    }
  };

  const fetchAlertasAndProductos = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');

      // Obtener alertas y productos en paralelo
      const [alertasResponse, productosResponse] = await Promise.all([
        api.get('/alertas', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
          signal: abortController.current.signal
        }),
        api.get('/productosmonitoreados/detalles', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
          signal: abortController.current.signal
        })
      ]);

      const alertasData = alertasResponse.data.alertas || alertasResponse.data;
      const productosData = productosResponse.data.productos || productosResponse.data;

      setAlertas(alertasData);
      setProductos(productosData);

      // Actualizar conteo de alertas pendientes
      const pendientes = alertasData.filter((a: Alerta) => a.estado === 'pendiente').length;
      setAlertCount(pendientes);
    } catch (error: any) {
      console.error('Error cargando alertas y productos:', error);
      throw error;
    }
  };

  const handleFetchError = (error: any) => {
    console.error('Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });

    let errorMsg = 'Error cargando datos';
    if (error.response) {
      errorMsg = error.response.data?.message || `Error ${error.response.status}`;
    } else if (error.message.includes('token')) {
      errorMsg = 'Sesión expirada';
    }
    
    setErrorMessage(errorMsg);
    setUserData(null);
  };

  useEffect(() => {
    fetchData();
    return () => abortController.current.abort();
  }, [refreshUserData]);

  const panResponder = useRef(
    PanResponder.create({
      // Solo capturar si el gesto empieza en el borde izquierdo (menos de 30px) o si el sidebar está abierto
      onStartShouldSetPanResponder: (e) => {
        const x = e.nativeEvent.pageX;
        return x < 30 || isSidebarOpen;
      },
      onMoveShouldSetPanResponder: (e, gestureState) => {
        // También capturar si nos estamos moviendo horizontalmente
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && (isSidebarOpen || e.nativeEvent.pageX < 30);
      },
      onPanResponderGrant: (e) => {
        // Detener cualquier animación en curso
        sidebarTranslateX.stopAnimation();
      },
      onPanResponderMove: (e, gestureState) => {
        // Mover el sidebar siguiendo el dedo
        if (isSidebarOpen) {
          // Si está abierto, permitir arrastrar hacia la izquierda para cerrar
          const newX = Math.max(0, Math.min(320, gestureState.dx));
          sidebarTranslateX.setValue(newX);
        } else {
          // Si está cerrado, permitir arrastrar desde la izquierda para abrir
          const newX = Math.max(-320, Math.min(0, gestureState.dx - 320));
          sidebarTranslateX.setValue(newX);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        // Determinar si abrir o cerrar basado en la posición y velocidad
        const shouldOpen = isSidebarOpen
          ? gestureState.dx > 100 || gestureState.vx > 0.5
          : gestureState.dx > 100 || gestureState.vx > 0.5;

        if (shouldOpen) {
          openSidebar();
        } else {
          closeSidebar();
        }
      },
    })
  ).current;

  // Función para abrir el sidebar con animación
  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.timing(sidebarTranslateX, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // Función para cerrar el sidebar con animación
  const closeSidebar = () => {
    Animated.timing(sidebarTranslateX, {
      toValue: -320,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Solo cambiar el estado DESPUÉS de que termine la animación
      setIsSidebarOpen(false);
    });
  };

  const handleRetry = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await fetchData();
    } catch (error) {
      handleFetchError(error);
    }
  };

  const handleAlertPress = () => {
    setIsAlertsOpen(true);
  };

  const isLoading = loading || externalLoading;

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={tw`mt-4 text-gray-600`}>Cargando datos...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={tw`flex-1 justify-center items-center p-6`}>
        <Text style={tw`text-red-500 text-lg font-medium mb-4`}>⚠️ {errorMessage}</Text>
        <TouchableOpacity
          onPress={handleRetry}
          style={tw`bg-blue-500 px-6 py-3 rounded-lg`}
        >
          <Text style={tw`text-white font-medium`}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text style={tw`text-red-500 text-lg`}>⚠️ Datos de usuario no disponibles</Text>
        <TouchableOpacity
          onPress={handleRetry}
          style={tw`mt-4 bg-blue-500 px-6 py-3 rounded-lg`}
        >
          <Text style={tw`text-white font-medium`}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f8fafc', '#eff6ff', '#ecfeff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={tw`flex-1`}
    >
      <View
        {...panResponder.panHandlers}
        style={tw`flex-1`}
      >
        {/* Overlay para sidebar */}
        {isSidebarOpen && (
          <TouchableOpacity
            style={tw`absolute inset-0 bg-black/20 z-40`}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        )}

        <Header
          title={title}
          alertCount={alertCount}
          onMenuPress={openSidebar}
          onAlertPress={handleAlertPress}
          onProfilePress={openSidebar}
          userData={userData}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          userData={userData}
          sidebarTranslateX={sidebarTranslateX}
        />

        <AlertNotifications
          isOpen={isAlertsOpen}
          onClose={() => setIsAlertsOpen(false)}
          alertas={alertas}
          productos={productos}
        />

        <View style={tw`flex-1`}>
          {children}
        </View>
      </View>
    </LinearGradient>
  );
};

export default MainLayout;