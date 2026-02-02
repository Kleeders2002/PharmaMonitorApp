// src/presentation/components/AlertNotifications.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Platform, StatusBar } from 'react-native';
import { AlertTriangle, MapPin, Thermometer, ChevronRight, X } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { format } from 'date-fns';
import {es} from 'date-fns/locale/es';
import { RootStackParamList } from '../navigation/types';

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

interface AlertNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  alertas: Alerta[];
  productos: ProductoMonitoreado[];
}

const AlertNotifications: React.FC<AlertNotificationsProps> = ({ 
  isOpen, 
  onClose, 
  alertas,
  productos 
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const statusBarHeight = Platform.OS === 'ios' ? StatusBar.currentHeight || 44 : StatusBar.currentHeight || 0;

  if (!isOpen) return null;

  const getProducto = (idProducto: number) => {
    return productos.find(p => p.id === idProducto) || {
      localizacion: 'Ubicación desconocida',
      foto_producto: 'https://via.placeholder.com/150'
    };
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM, HH:mm', { locale: es });
  };

  const alertasActivas = alertas
    .filter(a => a.estado === 'pendiente')
    .sort(
      (a, b) =>
        new Date(b.fecha_generacion).getTime() -
        new Date(a.fecha_generacion).getTime()
    )
    .slice(0, 10); // Solo mostrar las 10 más recientes

  const handleVerTodasAlertas = () => {
    navigation.navigate('AlertasScreen');
    onClose();
  };

  const handleAlertaPress = (alertaId: number) => {
    // Aquí podrías navegar a un detalle de alerta específico si lo necesitas
    navigation.navigate('AlertasScreen');
    onClose();
  };

  return (
    <View style={tw`absolute inset-0 z-50 bg-black bg-opacity-20`}>
      <View 
        style={tw.style(
          `absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-50`,
          { paddingTop: statusBarHeight }
        )}
      >
        <View style={tw`p-4 border-b border-gray-100 flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center`}>
            <AlertTriangle stroke="#f43f5e" width={20} height={20} />
            <Text style={tw`text-lg font-semibold ml-2 text-black`}>
              Alertas Activas
            </Text>
            <Text style={tw`text-sm ml-2 text-gray-500`}>
              ({alertasActivas.length})
            </Text>
          </View>
          
          {/* Botón para cerrar las notificaciones */}
          <TouchableOpacity
            onPress={onClose}
            style={tw`p-2 rounded-full bg-gray-100`}
          >
            <X stroke="#64748b" width={20} height={20} />
          </TouchableOpacity>
        </View>

        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          <View style={tw`p-2`}>
            {alertasActivas.length === 0 ? (
              <View style={tw`py-8 items-center justify-center`}>
                <Text style={tw`text-gray-500 text-base`}>No hay alertas activas</Text>
              </View>
            ) : (
              alertasActivas.slice(0, 10).map(alerta => {
                const producto = getProducto(alerta.id_producto_monitoreado);
                return (
                  <TouchableOpacity
                    key={alerta.id}
                    style={tw`mb-2 bg-white rounded-lg p-3 border border-gray-100`}
                    onPress={() => handleAlertaPress(alerta.id)}
                  >
                    <View style={tw`flex-row`}>
                      <View style={tw`w-1 h-full bg-red-500 rounded-full mr-3`} />
                      <View style={tw`flex-1`}>
                        <Text style={tw`font-medium text-sm text-gray-900 mb-1`}>
                          {alerta.mensaje}
                        </Text>
                        
                        <View style={tw`flex-row items-center mb-2`}>
                          <MapPin stroke="#9ca3af" width={14} height={14} />
                          <Text style={tw`text-gray-500 text-xs ml-1`}>
                            {producto.localizacion}
                          </Text>
                        </View>
                        
                        <View style={tw`flex-row justify-between items-center`}>
                          <View style={tw`flex-row items-center`}>
                            <Thermometer stroke="#3b82f6" width={14} height={14} />
                            <Text style={tw`text-gray-500 text-xs ml-1`}>
                              Límites: {alerta.limite_min} - {alerta.limite_max}
                            </Text>
                          </View>
                          
                          <Text style={tw`text-red-600 font-semibold text-sm`}>
                            {alerta.valor_medido.toFixed(2)}
                          </Text>
                        </View>
                        
                        <View style={tw`flex-row justify-between items-center mt-2`}>
                          <Text style={tw`text-gray-400 text-xs`}>
                            {formatDate(alerta.fecha_generacion)}
                          </Text>
                          
                          <Image
                            source={{ uri: producto.foto_producto }}
                            style={tw`w-10 h-10 rounded bg-gray-100`}
                            resizeMode="cover"
                          />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
        
        {alertasActivas.length > 0 && (
          <TouchableOpacity
            style={tw`p-4 border-t border-gray-100 flex-row justify-center items-center`}
            onPress={handleVerTodasAlertas}
          >
            <Text style={tw`text-blue-600 font-medium mr-1`}>
              Ver todas las alertas
            </Text>
            <ChevronRight stroke="#2563eb" width={16} height={16} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Overlay para cerrar las notificaciones al tocar fuera */}
      <TouchableOpacity 
        style={tw`absolute inset-0`} 
        onPress={onClose}
        activeOpacity={0.2}
      />
    </View>
  );
};

export default AlertNotifications;