// src/context/CondicionesContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../../api';

// Interfaces
interface CondicionAlmacenamiento {
  id?: number;
  nombre: string;
  temperatura_min: number;
  temperatura_max: number;
  humedad_min: number;
  humedad_max: number;
  lux_min: number;
  lux_max: number;
  presion_min: number;
  presion_max: number;
  fecha_actualizacion: string;
}

interface CondicionesContextType {
  condiciones: CondicionAlmacenamiento[];
  filteredCondiciones: CondicionAlmacenamiento[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  searchTerm: string;
  handleSearch: (text: string) => void;
  fetchCondiciones: () => Promise<void>;
}

// Crear el contexto
const CondicionesContext = createContext<CondicionesContextType>({
  condiciones: [],
  filteredCondiciones: [],
  loading: true,
  error: null,
  refreshing: false,
  searchTerm: '',
  handleSearch: () => {},
  fetchCondiciones: async () => {},
});

// Hook personalizado para usar el contexto
export const useCondiciones = () => useContext(CondicionesContext);

// Proveedor del contexto
export const CondicionesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [condiciones, setCondiciones] = useState<CondicionAlmacenamiento[]>([]);
  const [filteredCondiciones, setFilteredCondiciones] = useState<CondicionAlmacenamiento[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Función de búsqueda
  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
    if (text) {
      const filtered = condiciones.filter(condicion =>
        condicion.nombre.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCondiciones(filtered);
    } else {
      setFilteredCondiciones(condiciones);
    }
  }, [condiciones]);

  // Función para cargar condiciones
  const fetchCondiciones = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const response = await api.get("/condiciones");
      const condicionesData = response.data.map((condicion: any) => ({
        ...condicion,
        fecha_actualizacion: new Date(condicion.fecha_actualizacion).toLocaleDateString()
      }));
      
      setCondiciones(condicionesData);
      setFilteredCondiciones(condicionesData);
    } catch (err: any) {
      console.error("Error fetching condiciones:", err);
      setError("Error al cargar la lista de condiciones de almacenamiento.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Valores proporcionados por el contexto
  const value = {
    condiciones,
    filteredCondiciones,
    loading,
    error,
    refreshing,
    searchTerm,
    handleSearch,
    fetchCondiciones
  };

  return (
    <CondicionesContext.Provider value={value}>
      {children}
    </CondicionesContext.Provider>
  );
};