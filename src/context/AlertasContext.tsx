// // src/context/AlertasContext.tsx
// import React, { createContext, useContext, useState, useCallback } from 'react';
// import api from '../../api';

// // Interfaces
// interface ProductoMonitoreado {
//   id: number;
//   nombre_producto: string;
//   localizacion: string;
//   cantidad: number;
//   foto_producto: string;
// }

// interface Alerta {
//   id: number;
//   id_producto_monitoreado: number;
//   parametro_afectado: string;
//   valor_medido: number;
//   limite_min: number;
//   limite_max: number;
//   mensaje: string;
//   fecha_generacion: string;
//   fecha_resolucion: string | null;
//   duracion_minutos: number;
//   estado: 'pendiente' | 'resuelta';
// }

// interface AlertasContextType {
//   alertas: Alerta[];
//   productos: ProductoMonitoreado[];
//   loading: boolean;
//   error: string | null;
//   refreshing: boolean;
//   selectedDate: string;
//   pendingAlertas: Alerta[];
//   resolvedAlertas: Alerta[];
//   fetchAlertas: () => Promise<void>;
//   getProductoInfo: (idProducto: number) => ProductoMonitoreado;
//   setSelectedDate: (date: string) => void;
// }

// // Crear el contexto
// const AlertasContext = createContext<AlertasContextType>({
//   alertas: [],
//   productos: [],
//   loading: true,
//   error: null,
//   refreshing: false,
//   selectedDate: '',
//   pendingAlertas: [],
//   resolvedAlertas: [],
//   fetchAlertas: async () => {},
//   getProductoInfo: () => ({
//     id: 0,
//     nombre_producto: '',
//     localizacion: '',
//     cantidad: 0,
//     foto_producto: ''
//   }),
//   setSelectedDate: () => {},
// });

// // Hook personalizado para usar el contexto
// export const useAlertas = () => useContext(AlertasContext);

// // Proveedor del contexto
// export const AlertasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [alertas, setAlertas] = useState<Alerta[]>([]);
//   const [productos, setProductos] = useState<ProductoMonitoreado[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [refreshing, setRefreshing] = useState<boolean>(false);
//   const [selectedDate, setSelectedDateState] = useState<string>('');

//   // Función para obtener información del producto
//   const getProductoInfo = useCallback((idProducto: number) => {
//     return productos.find(p => p.id === idProducto) || {
//       id: 0,
//       nombre_producto: "Producto desconocido",
//       localizacion: "N/A",
//       cantidad: 0,
//       foto_producto: ""
//     };
//   }, [productos]);

//   // Función para filtrar alertas por estado
//   const filtrarAlertas = useCallback((estado: 'pendiente' | 'resuelta') => {
//     return alertas
//       .filter(a => a.estado === estado && 
//         (selectedDate ? 
//           new Date(a.fecha_generacion).toISOString().split("T")[0] === selectedDate : 
//           true))
//       .sort((a, b) => new Date(b.fecha_generacion).getTime() - new Date(a.fecha_generacion).getTime());
//   }, [alertas, selectedDate]);

//   // Función para cargar alertas y productos
//   const fetchAlertas = useCallback(async () => {
//     try {
//       setLoading(true);
//       setRefreshing(true);
//       setError(null);
     
//       const [alertasResponse, productosResponse] = await Promise.all([
//         api.get("/alertas"),
//         api.get("/productosmonitoreados/detalles")
//       ]);
      
//       setAlertas(alertasResponse.data);
//       setProductos(productosResponse.data);
//     } catch (err: any) {
//       console.error("Error fetching alertas:", err);
//       setError("Error al cargar las alertas de monitoreo.");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   // Establecer fecha seleccionada
//   const setSelectedDate = (date: string) => {
//     setSelectedDateState(date);
//   };

//   // Calcular alertas pendientes y resueltas
//   const pendingAlertas = filtrarAlertas('pendiente');
//   const resolvedAlertas = filtrarAlertas('resuelta');

//   // Valores proporcionados por el contexto
//   const value = {
//     alertas,
//     productos,
//     loading,
//     error,
//     refreshing,
//     selectedDate,
//     pendingAlertas,
//     resolvedAlertas,
//     fetchAlertas,
//     getProductoInfo,
//     setSelectedDate
//   };

//   return (
//     <AlertasContext.Provider value={value}>
//       {children}
//     </AlertasContext.Provider>
//   );
// };

// src/context/AlertasContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../../api';
import NotificationService from '../services/NotificationService';

// Interfaces
interface ProductoMonitoreado {
  id: number;
  nombre_producto: string;
  localizacion: string;
  cantidad: number;
  foto_producto: string;
}

interface Alerta {
  id: number;
  id_producto_monitoreado: number;
  parametro_afectado: string;
  valor_medido: number;
  limite_min: number;
  limite_max: number;
  mensaje: string;
  fecha_generacion: string;
  fecha_resolucion: string | null;
  duracion_minutos: number;
  estado: 'pendiente' | 'resuelta';
}

interface AlertasContextType {
  alertas: Alerta[];
  productos: ProductoMonitoreado[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  selectedDate: string;
  pendingAlertas: Alerta[];
  resolvedAlertas: Alerta[];
  fetchAlertas: () => Promise<void>;
  loadMoreAlertas: () => Promise<void>;
  hasMore: boolean;
  getProductoInfo: (idProducto: number) => ProductoMonitoreado;
  setSelectedDate: (date: string) => void;
  initializeNotifications: () => Promise<void>;
}

// Crear el contexto
const AlertasContext = createContext<AlertasContextType>({
  alertas: [],
  productos: [],
  loading: true,
  error: null,
  refreshing: false,
  selectedDate: '',
  pendingAlertas: [],
  resolvedAlertas: [],
  fetchAlertas: async () => {},
  getProductoInfo: () => ({
    id: 0,
    nombre_producto: '',
    localizacion: '',
    cantidad: 0,
    foto_producto: ''
  }),
  setSelectedDate: () => {},
  initializeNotifications: async () => {},
});

// Hook personalizado para usar el contexto
export const useAlertas = () => useContext(AlertasContext);

// Proveedor del contexto
export const AlertasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [productos, setProductos] = useState<ProductoMonitoreado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDate, setSelectedDateState] = useState<string>('');
  const [previousPendingIds, setPreviousPendingIds] = useState<Set<number>>(new Set());

  // Estados para paginación
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const ALERTAS_LIMIT = 20; // Cargar de 20 en 20

  // Inicializar notificaciones al montar el componente
  useEffect(() => {
    initializeNotifications();
    
    // Limpiar listeners al desmontar
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  // Función para inicializar notificaciones
  const initializeNotifications = useCallback(async () => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (hasPermission) {
        console.log('Permisos de notificación otorgados');
        await NotificationService.restoreActiveNotifications();
      } else {
        console.log('Permisos de notificación denegados');
      }
    } catch (error) {
      console.error('Error inicializando notificaciones:', error);
    }
  }, []);

  // Función para obtener información del producto
  const getProductoInfo = useCallback((idProducto: number) => {
    return productos.find(p => p.id === idProducto) || {
      id: 0,
      nombre_producto: "Producto desconocido",
      localizacion: "N/A",
      cantidad: 0,
      foto_producto: ""
    };
  }, [productos]);

  // Función para filtrar alertas por estado
  const filtrarAlertas = useCallback((estado: 'pendiente' | 'resuelta') => {
    return alertas
      .filter(a => a.estado === estado && 
        (selectedDate ? 
          new Date(a.fecha_generacion).toISOString().split("T")[0] === selectedDate : 
          true))
      .sort((a, b) => new Date(b.fecha_generacion).getTime() - new Date(a.fecha_generacion).getTime());
  }, [alertas, selectedDate]);

  // Función para gestionar notificaciones según cambios en alertas
  const manageNotifications = useCallback(async (currentAlertas: Alerta[]) => {
    try {
      const currentPendingIds = new Set(
        currentAlertas
          .filter(a => a.estado === 'pendiente')
          .map(a => a.id)
      );

      // Detectar nuevas alertas pendientes
      const newAlerts = currentAlertas.filter(
        a => a.estado === 'pendiente' && !previousPendingIds.has(a.id)
      );

      // Detectar alertas resueltas
      const resolvedAlertIds = Array.from(previousPendingIds).filter(
        id => !currentPendingIds.has(id)
      );

      // Crear notificaciones para nuevas alertas
      for (const alerta of newAlerts) {
        const producto = getProductoInfo(alerta.id_producto_monitoreado);
        
        await NotificationService.createPersistentAlertNotification({
          id: alerta.id,
          mensaje: alerta.mensaje,
          parametro_afectado: alerta.parametro_afectado,
          valor_medido: alerta.valor_medido,
          producto: producto.nombre_producto,
          localizacion: producto.localizacion,
        });
      }

      // Cancelar notificaciones de alertas resueltas
      for (const alertaId of resolvedAlertIds) {
        await NotificationService.cancelAlertNotification(alertaId);
      }

      // Actualizar el conjunto de IDs pendientes previos
      setPreviousPendingIds(currentPendingIds);
    } catch (error) {
      console.error('Error gestionando notificaciones:', error);
    }
  }, [previousPendingIds, getProductoInfo]);

  // Función para cargar alertas y productos
  const fetchAlertas = useCallback(async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setAlertas([]);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const [alertasResponse, productosResponse] = await Promise.all([
        api.get(`/alertas?limit=${ALERTAS_LIMIT}&offset=${reset ? 0 : offset}`),
        api.get("/productosmonitoreados/detalles")
      ]);

      const alertasData = alertasResponse.data.alertas || alertasResponse.data;
      const productosData = productosResponse.data.productos || productosResponse.data;

      if (reset) {
        setAlertas(alertasData);
      } else {
        setAlertas(prev => [...prev, ...alertasData]);
      }

      setProductos(productosData);

      // Verificar si hay más alertas para cargar
      if (alertasData.length < ALERTAS_LIMIT) {
        setHasMore(false);
      } else {
        setOffset(prev => prev + ALERTAS_LIMIT);
      }

      // Gestionar notificaciones después de actualizar las alertas (solo en la carga inicial)
      if (reset) {
        await manageNotifications(alertasData);
      }
    } catch (err: any) {
      console.error("Error fetching alertas:", err);
      setError("Error al cargar las alertas de monitoreo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [manageNotifications, offset, ALERTAS_LIMIT]);

  // Función para cargar más alertas (paginación)
  const loadMoreAlertas = useCallback(async () => {
    if (refreshing || !hasMore) return;
    await fetchAlertas(false);
  }, [fetchAlertas, refreshing, hasMore]);

  // Establecer fecha seleccionada
  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
  };

  // Calcular alertas pendientes y resueltas
  const pendingAlertas = filtrarAlertas('pendiente');
  const resolvedAlertas = filtrarAlertas('resuelta');

  // Valores proporcionados por el contexto
  const value = {
    alertas,
    productos,
    loading,
    error,
    refreshing,
    selectedDate,
    pendingAlertas,
    resolvedAlertas,
    fetchAlertas,
    loadMoreAlertas,
    hasMore,
    getProductoInfo,
    setSelectedDate,
    initializeNotifications,
  };

  return (
    <AlertasContext.Provider value={value}>
      {children}
    </AlertasContext.Provider>
  );
};