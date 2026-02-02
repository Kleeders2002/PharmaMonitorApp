// src/context/PerfilContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../../api';

// Interfaces
interface User {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  foto: string | null;
}

interface PerfilContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
  refreshing: boolean;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (userData: User) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  uploadProfileImage: (formData: FormData) => Promise<string>;
  clearMessages: () => void;
}

// Create context
const PerfilContext = createContext<PerfilContextType>({
  user: null,
  loading: false,
  error: null,
  success: null,
  isSubmitting: false,
  refreshing: false,
  fetchUserProfile: async () => {},
  updateUserProfile: async () => {},
  updateUserPassword: async () => {},
  uploadProfileImage: async () => "",
  clearMessages: () => {},
});

// Custom hook to use the context
export const useUser = () => useContext(PerfilContext);

// Context provider
export const PerfilProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Clear success and error messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const response = await api.get('/perfil');
      
      setUser({
        id: response.data.id,
        nombre: response.data.nombre,
        apellido: response.data.apellido,
        email: response.data.email,
        foto: response.data.foto || null,
      });
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      setError("Error al cargar los datos del perfil");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (userData: User) => {
    try {
      setIsSubmitting(true);
      clearMessages();
      
      const response = await api.put('/perfil', userData);
      
      if (response.status === 200) {
        setUser(userData);
        setSuccess('Perfil actualizado exitosamente');
      }
    } catch (err: any) {
      console.error("Error updating user profile:", err);
      setError(err.response?.data?.detail || 'Error al actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  }, [clearMessages]);

  // Update user password
  const updateUserPassword = useCallback(async (newPassword: string) => {
    try {
      setIsSubmitting(true);
      clearMessages();
      
      const response = await api.put('/perfil/password', { 
        new_password: newPassword 
      });
      
      if (response.status === 200) {
        setSuccess('Contraseña actualizada exitosamente');
      }
    } catch (err: any) {
      console.error("Error updating password:", err);
      const errorDetail = err.response?.data?.detail;
      const errorMessage = Array.isArray(errorDetail) && errorDetail.length > 0 
        ? errorDetail[0].msg 
        : 'Error al actualizar la contraseña';
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [clearMessages]);

  // Upload profile image
  const uploadProfileImage = useCallback(async (formData: FormData): Promise<string> => {
    try {
      clearMessages();
      
      const response = await api.post("/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if ([200, 201].includes(response.status)) {
        return response.data.url;
      }
      return "";
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError('Error al subir la imagen de perfil');
      return "";
    }
  }, [clearMessages]);

  // Context value
  const value = {
    user,
    loading,
    error,
    success,
    isSubmitting,
    refreshing,
    fetchUserProfile,
    updateUserProfile,
    updateUserPassword,
    uploadProfileImage,
    clearMessages,
  };

  return (
    <PerfilContext.Provider value={value}>
      {children}
    </PerfilContext.Provider>
  );
};