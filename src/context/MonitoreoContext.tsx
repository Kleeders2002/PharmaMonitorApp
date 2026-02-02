// src/context/MonitoreoContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../../api';

// Interfaces
interface ProductoMonitoreado {
  id?: number;
  id_producto: number;
  localizacion: string;
  cantidad: number;
  fecha_inicio_monitoreo: string;
  producto?: {
    nombre: string;
    formula: string;
    concentracion: string;
    foto: string;
    formafarmaceutica?: string;
  };
}

interface NuevoMonitoreo {
  id_producto: number;
  localizacion: string;
  cantidad: number;
  fecha_inicio_monitoreo: string;
}

interface MonitoreoContextType {
  productosMonitoreados: ProductoMonitoreado[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  submitLoading: boolean;
  submitError: string | null;
  
  fetchProductosMonitoreados: () => Promise<void>;
  agregarProductoMonitoreado: (nuevoMonitoreo: NuevoMonitoreo) => Promise<boolean>;
  actualizarProductoMonitoreado: (id: number, cantidad: number) => Promise<boolean>;
  eliminarProductoMonitoreado: (id: number) => Promise<boolean>;
}

// Crear el contexto
const MonitoreoContext = createContext<MonitoreoContextType>({
  productosMonitoreados: [],
  loading: true,
  error: null,
  refreshing: false,
  submitLoading: false,
  submitError: null,
  
  fetchProductosMonitoreados: async () => {},
  agregarProductoMonitoreado: async () => false,
  actualizarProductoMonitoreado: async () => false,
  eliminarProductoMonitoreado: async () => false,
});

// Hook personalizado para usar el contexto
export const useMonitoreo = () => useContext(MonitoreoContext);

// Proveedor del contexto
export const MonitoreoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productosMonitoreados, setProductosMonitoreados] = useState<ProductoMonitoreado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Función para cargar productos monitoreados
  const fetchProductosMonitoreados = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const response = await api.get("/productosmonitoreados");
      setProductosMonitoreados(response.data);
    } catch (err: any) {
      console.error("Error fetching productos monitoreados:", err);
      setError("Error al cargar la lista de productos monitoreados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Función para agregar un nuevo producto monitoreado
  const agregarProductoMonitoreado = useCallback(async (nuevoMonitoreo: NuevoMonitoreo): Promise<boolean> => {
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      
      const response = await api.post("/productosmonitoreados/", nuevoMonitoreo);
      
      // Actualizar la lista local si es necesario
      await fetchProductosMonitoreados();
      
      return true;
    } catch (err: any) {
      console.error("Error agregando producto monitoreado:", err);
      setSubmitError("Error al agregar el producto al monitoreo.");
      return false;
    } finally {
      setSubmitLoading(false);
    }
  }, [fetchProductosMonitoreados]);

  // Función para actualizar un producto monitoreado
  const actualizarProductoMonitoreado = useCallback(async (id: number, cantidad: number): Promise<boolean> => {
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      
      await api.patch(`/productosmonitoreados/${id}/`, { cantidad });
      
      // Actualizar el estado local
      setProductosMonitoreados(prevProductos => 
        prevProductos.map(producto => 
          producto.id === id ? { ...producto, cantidad } : producto
        )
      );
      
      return true;
    } catch (err: any) {
      console.error("Error actualizando producto monitoreado:", err);
      setSubmitError("Error al actualizar el producto monitoreado.");
      return false;
    } finally {
      setSubmitLoading(false);
    }
  }, []);

  // Función para eliminar un producto monitoreado
  const eliminarProductoMonitoreado = useCallback(async (id: number): Promise<boolean> => {
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      
      await api.delete(`/productosmonitoreados/${id}/`);
      
      // Actualizar el estado local
      setProductosMonitoreados(prevProductos => 
        prevProductos.filter(producto => producto.id !== id)
      );
      
      return true;
    } catch (err: any) {
      console.error("Error eliminando producto monitoreado:", err);
      setSubmitError("Error al eliminar el producto monitoreado.");
      return false;
    } finally {
      setSubmitLoading(false);
    }
  }, []);

  // Valores proporcionados por el contexto
  const value = {
    productosMonitoreados,
    loading,
    error,
    refreshing,
    submitLoading,
    submitError,
    
    fetchProductosMonitoreados,
    agregarProductoMonitoreado,
    actualizarProductoMonitoreado,
    eliminarProductoMonitoreado
  };

  return (
    <MonitoreoContext.Provider value={value}>
      {children}
    </MonitoreoContext.Provider>
  );
};

export default MonitoreoContext;