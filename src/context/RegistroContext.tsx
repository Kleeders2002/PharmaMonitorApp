// src/context/RegistroContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../../api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Interfaces
export interface Registro {
  id: number;
  rol_usuario: string;
  tipo_operacion: string;
  entidad_afectada: string;
  nombre_usuario: string;
  id_usuario: number;
  fecha: string;
  detalles: Record<string, any>;
}

interface RegistrosContextType {
  registros: Registro[];
  filteredRegistros: Registro[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  searchTerm: string;
  selectedFilter: string;
  handleSearch: (text: string) => void;
  setSelectedFilter: (filter: string) => void;
  fetchRegistros: () => Promise<void>;
  currentPage: number;
  loadMore: () => void;
}

// Opciones de filtro
export const filterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'crear', label: 'Creaciones' },
  { value: 'actualizar', label: 'Actualizaciones' },
  { value: 'eliminar', label: 'Eliminaciones' },
];

// Crear el contexto
const RegistrosContext = createContext<RegistrosContextType>({
  registros: [],
  filteredRegistros: [],
  loading: true,
  error: null,
  refreshing: false,
  searchTerm: '',
  selectedFilter: 'all',
  handleSearch: () => {},
  setSelectedFilter: () => {},
  fetchRegistros: async () => {},
  currentPage: 1,
  loadMore: () => {},
});

// Hook personalizado para usar el contexto
export const useRegistros = () => useContext(RegistrosContext);

// Proveedor del contexto
export const RegistrosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [filteredRegistros, setFilteredRegistros] = useState<Registro[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilterState] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const recordsPerPage = 10;

  // Función para filtrar registros
  const filterRegistros = useCallback((data: Registro[], term: string, filter: string) => {
    return data.filter(registro => {
      const matchesSearch = term === '' || 
        Object.values(registro).some(value => 
          typeof value === 'string' && value.toLowerCase().includes(term.toLowerCase())
        ) ||
        registro.nombre_usuario.toLowerCase().includes(term.toLowerCase()) ||
        registro.entidad_afectada.toLowerCase().includes(term.toLowerCase());
      
      const matchesFilter = filter === 'all' || registro.tipo_operacion === filter;
      
      return matchesSearch && matchesFilter;
    });
  }, []);

  // Función de búsqueda
  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
    const filtered = filterRegistros(registros, text, selectedFilter);
    setFilteredRegistros(filtered);
    setCurrentPage(1); // Reset page when searching
  }, [registros, selectedFilter, filterRegistros]);

  // Función para cambiar filtro
  const setSelectedFilter = useCallback((filter: string) => {
    setSelectedFilterState(filter);
    const filtered = filterRegistros(registros, searchTerm, filter);
    setFilteredRegistros(filtered);
    setCurrentPage(1); // Reset page when filtering
  }, [registros, searchTerm, filterRegistros]);

  // Función para cargar más registros
  const loadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  // Función para cargar registros
  const fetchRegistros = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const response = await api.get('/registros/');
      const sortedData = response.data.sort((a: Registro, b: Registro) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      
      setRegistros(sortedData);
      setFilteredRegistros(filterRegistros(sortedData, searchTerm, selectedFilter));
    } catch (err: any) {
      console.error("Error fetching registros:", err);
      setError("Error al cargar los registros del sistema.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, selectedFilter, filterRegistros]);

  // Valores proporcionados por el contexto
  const value = {
    registros,
    filteredRegistros,
    loading,
    error,
    refreshing,
    searchTerm,
    selectedFilter,
    handleSearch,
    setSelectedFilter,
    fetchRegistros,
    currentPage,
    loadMore
  };

  return (
    <RegistrosContext.Provider value={value}>
      {children}
    </RegistrosContext.Provider>
  );
};