// src/context/ProductosContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../../api';

// Interfaces
interface ProductoFarmaceutico {
  id?: number;
  nombre: string;
  formula: string;
  concentracion: string;
  indicaciones: string;
  contraindicaciones: string;
  efectos_secundarios: string;
  foto: string;
  formafarmaceutica?: string;
  condicion?: string;
}

interface ProductosContextType {
  productos: ProductoFarmaceutico[];
  filteredProductos: ProductoFarmaceutico[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  searchTerm: string;
  handleSearch: (text: string) => void;
  fetchProductos: () => Promise<void>;
}

// Crear el contexto
const ProductosContext = createContext<ProductosContextType>({
  productos: [],
  filteredProductos: [],
  loading: true,
  error: null,
  refreshing: false,
  searchTerm: '',
  handleSearch: () => {},
  fetchProductos: async () => {},
});

// Hook personalizado para usar el contexto
export const useProductos = () => useContext(ProductosContext);

// Proveedor del contexto
export const ProductosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productos, setProductos] = useState<ProductoFarmaceutico[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoFarmaceutico[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Función de búsqueda
  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
    if (text) {
      const filtered = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(text.toLowerCase()) ||
        producto.formula.toLowerCase().includes(text.toLowerCase()) ||
        producto.concentracion.toLowerCase().includes(text.toLowerCase()) ||
        (producto.formafarmaceutica?.toLowerCase() || '').includes(text.toLowerCase())
      );
      setFilteredProductos(filtered);
    } else {
      setFilteredProductos(productos);
    }
  }, [productos]);

  // Función para cargar productos
  const fetchProductos = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const response = await api.get("/productos");
      const productosData = response.data.map((producto: any) => ({
        ...producto,
        formafarmaceutica: producto.formafarmaceutica?.descripcion || "N/A",
        condicion: producto.condicion?.nombre || "N/A",
        contraindicaciones: producto.contraindicaciones || "",
        efectos_secundarios: producto.efectos_secundarios || "",
        indicaciones: producto.indicaciones || "",
      })); 
      
      setProductos(productosData);
      setFilteredProductos(productosData);
    } catch (err: any) {
      console.error("Error fetching productos:", err);
      setError("Error al cargar la lista de productos farmacéuticos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Valores proporcionados por el contexto
  const value = {
    productos,
    filteredProductos,
    loading,
    error,
    refreshing,
    searchTerm,
    handleSearch,
    fetchProductos
  };

  return (
    <ProductosContext.Provider value={value}>
      {children}
    </ProductosContext.Provider>
  );
};