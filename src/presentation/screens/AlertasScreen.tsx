// src/presentation/screens/AlertasScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  TextInput,
  RefreshControl,
  Platform
} from 'react-native';
import tw from 'twrnc';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Thermometer, 
  Sun,
  ChevronDown, 
  ChevronUp,
  Package,
  MapPin,
  Box
} from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import MainLayout from '../layouts/MainLayout';
import { useAlertas } from '../../context/AlertasContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Componente para tarjeta de alerta
interface AlertCardProps {
  alerta: any;
  producto: any;
}

const AlertCard: React.FC<AlertCardProps> = ({ alerta, producto }) => {
  const [expandDetails, setExpandDetails] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy, HH:mm", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };
  
  const getTimeFromNow = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      return "Tiempo desconocido";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Icono basado en el parámetro
  const renderParametroIcon = () => {
    switch (alerta.parametro_afectado) {
      case 'temperatura':
        return <Thermometer stroke="#3b82f6" width={20} height={20} />;
      case 'lux':
        return <Sun stroke="#3b82f6" width={20} height={20} />;
      default:
        return <AlertTriangle stroke="#3b82f6" width={20} height={20} />;
    }
  };

  return (
    <View style={tw`bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 mb-4 overflow-hidden`}>
      <View style={tw`p-4`}>
        {/* Encabezado de la tarjeta */}
        <View style={tw`flex-row`}>
          {/* Imagen del producto */}
          <View style={tw`w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden shadow-md`}>
            {producto.foto_producto ? (
              <Image
                source={{ uri: producto.foto_producto }}
                style={tw`w-full h-full`}
                resizeMode="cover"
              />
            ) : (
              <View style={tw`w-full h-full items-center justify-center`}>
                <Package stroke="#3b82f6" width={32} height={32} />
              </View>
            )}
          </View>

          {/* Información principal */}
          <View style={tw`flex-1 ml-4`}>
            <Text style={tw`text-xl font-bold text-gray-900`}>{producto.nombre_producto}</Text>

            <View style={tw`flex-row items-center mt-1.5`}>
              <View style={tw`flex-row items-center`}>
                <MapPin stroke="#6b7280" width={16} height={16} style={tw`mr-1`} />
                <Text style={tw`text-base text-gray-700`}>{producto.localizacion}</Text>
              </View>
            </View>

            <View style={tw`flex-row items-center mt-1.5`}>
              <Box stroke="#6b7280" width={16} height={16} style={tw`mr-1`} />
              <Text style={tw`text-base text-gray-700`}>{producto.cantidad} unidades</Text>
            </View>

            {/* Indicador de estado */}
            <View style={tw`flex-row mt-2.5 items-center`}>
              <View style={tw`
                flex-row items-center px-3 py-1.5 rounded-full
                ${alerta.estado === 'pendiente' ? 'bg-red-100' : 'bg-emerald-100'}
              `}>
                {alerta.estado === 'pendiente' ? (
                  <AlertTriangle
                    stroke={alerta.estado === 'pendiente' ? '#ef4444' : '#10b981'}
                    width={16}
                    height={16}
                    style={tw`mr-1.5`}
                  />
                ) : (
                  <CheckCircle
                    stroke={alerta.estado === 'pendiente' ? '#ef4444' : '#10b981'}
                    width={16}
                    height={16}
                    style={tw`mr-1.5`}
                  />
                )}
                <Text style={tw`text-sm font-semibold ${alerta.estado === 'pendiente' ? 'text-red-800' : 'text-emerald-800'}`}>
                  {alerta.estado.charAt(0).toUpperCase() + alerta.estado.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Icono de parámetro */}
          <View style={tw`p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 shadow-md`}>
            {renderParametroIcon()}
          </View>
        </View>
        
        {/* Mensaje de alerta */}
        <View style={tw`mt-3`}>
          <Text style={tw`text-base font-medium text-gray-800`}>{alerta.mensaje}</Text>
        </View>
        
        {/* Valores y límites */}
        <View style={tw`mt-3 bg-gray-50 p-3 rounded-lg`}>
          <View style={tw`flex-row justify-between`}>
            <View>
              <Text style={tw`text-xs text-gray-500`}>Valor medido</Text>
              <Text style={tw`text-base font-medium text-gray-800`}>{alerta.valor_medido.toFixed(2)}</Text>
            </View>
            <View>
              <Text style={tw`text-xs text-gray-500`}>Límites</Text>
              <Text style={tw`text-base font-medium text-gray-800`}>{alerta.limite_min} - {alerta.limite_max}</Text>
            </View>
            {alerta.estado === 'resuelta' && (
              <View>
                <Text style={tw`text-xs text-gray-500`}>Duración</Text>
                <Text style={tw`text-base font-medium text-gray-800`}>{formatDuration(alerta.duracion_minutos)}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Sección expandible con más detalles */}
        <TouchableOpacity 
          style={tw`mt-3 flex-row justify-between items-center py-2`}
          onPress={() => setExpandDetails(!expandDetails)}
        >
          <View style={tw`flex-row items-center`}>
            <Clock stroke="#6b7280" width={14} height={14} style={tw`mr-1`} />
            <Text style={tw`text-xs text-gray-500`}>
              {formatDate(alerta.fecha_generacion)}
              {alerta.estado === 'resuelta' && alerta.fecha_resolucion && ` - ${formatDate(alerta.fecha_resolucion)}`}
            </Text>
          </View>
          {expandDetails ? 
            <ChevronUp stroke="#64748b" width={16} height={16} /> : 
            <ChevronDown stroke="#64748b" width={16} height={16} />
          }
        </TouchableOpacity>
        
        {expandDetails && (
          <View style={tw`mt-2 pt-2 border-t border-gray-100`}>
            <View style={tw`mb-2`}>
              <Text style={tw`text-xs text-gray-500 mb-1`}>Generada</Text>
              <Text style={tw`text-sm text-gray-800`}>{formatDate(alerta.fecha_generacion)}</Text>
            </View>
            
            {alerta.estado === 'resuelta' && alerta.fecha_resolucion && (
              <>
                <View style={tw`mb-2`}>
                  <Text style={tw`text-xs text-gray-500 mb-1`}>Resuelta</Text>
                  <Text style={tw`text-sm text-gray-800`}>{formatDate(alerta.fecha_resolucion)}</Text>
                </View>
                
                <View>
                  <Text style={tw`text-xs text-gray-500 mb-1`}>Resuelta hace</Text>
                  <Text style={tw`text-sm text-gray-800`}>{getTimeFromNow(alerta.fecha_resolucion)}</Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const AlertasScreen = () => {
  const {
    pendingAlertas,
    resolvedAlertas,
    loading,
    error,
    refreshing,
    selectedDate,
    fetchAlertas,
    loadMoreAlertas,
    hasMore,
    getProductoInfo,
    setSelectedDate
  } = useAlertas();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPendingSection, setShowPendingSection] = useState(true);
  const [showResolvedSection, setShowResolvedSection] = useState(true);

  // Cargar alertas al montar el componente
  useEffect(() => {
    fetchAlertas();
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const onLoadMore = () => {
    if (!refreshing && hasMore) {
      loadMoreAlertas();
    }
  };

  // Contenido principal de la pantalla
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-600`}>Cargando alertas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <View style={tw`bg-red-50 p-6 rounded-2xl w-full items-center`}>
            <AlertTriangle stroke="#ef4444" width={40} height={40} />
            <Text style={tw`mt-3 text-lg font-bold text-red-600`}>Error de carga</Text>
            <Text style={tw`text-red-500 text-center mt-1`}>{error}</Text>
            <TouchableOpacity
              style={tw`mt-4 bg-red-100 px-4 py-2 rounded-lg`}
              onPress={fetchAlertas}
            >
              <Text style={tw`text-red-700 font-medium`}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (pendingAlertas.length === 0 && resolvedAlertas.length === 0) {
      return (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <AlertTriangle stroke="#a1a1aa" width={48} height={48} />
          <Text style={tw`mt-4 text-lg font-medium text-gray-700`}>
            No se encontraron alertas
          </Text>
          <Text style={tw`text-gray-500 text-center mt-1`}>
            {selectedDate ? "Prueba con otra fecha" : "No hay alertas disponibles"}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={[]} // Placeholder
        renderItem={null}
        ListHeaderComponent={() => (
          <>
            {/* Sección de alertas pendientes */}
            {pendingAlertas.length > 0 && (
              <View style={tw`mb-6`}>
                <TouchableOpacity 
                  style={tw`flex-row justify-between items-center mb-3`}
                  onPress={() => setShowPendingSection(!showPendingSection)}
                >
                  <View style={tw`flex-row items-center`}>
                    <AlertTriangle stroke="#ef4444" width={18} height={18} />
                    <Text style={tw`ml-2 text-lg font-semibold text-red-600`}>
                      Alertas Pendientes
                    </Text>
                    <View style={tw`ml-2 bg-red-100 px-2 py-0.5 rounded-full`}>
                      <Text style={tw`text-xs font-medium text-red-800`}>
                        {pendingAlertas.length}
                      </Text>
                    </View>
                  </View>
                  {showPendingSection ? 
                    <ChevronUp stroke="#ef4444" width={20} height={20} /> : 
                    <ChevronDown stroke="#ef4444" width={20} height={20} />
                  }
                </TouchableOpacity>
                
                {showPendingSection && pendingAlertas.map(alerta => (
                  <AlertCard 
                    key={`pending-${alerta.id}`}
                    alerta={alerta} 
                    producto={getProductoInfo(alerta.id_producto_monitoreado)}
                  />
                ))}
              </View>
            )}
            
            {/* Sección de alertas resueltas */}
            {resolvedAlertas.length > 0 && (
              <View style={tw`mb-6`}>
                <TouchableOpacity 
                  style={tw`flex-row justify-between items-center mb-3`}
                  onPress={() => setShowResolvedSection(!showResolvedSection)}
                >
                  <View style={tw`flex-row items-center`}>
                    <CheckCircle stroke="#22c55e" width={18} height={18} />
                    <Text style={tw`ml-2 text-lg font-semibold text-green-600`}>
                      Alertas Resueltas
                    </Text>
                    <View style={tw`ml-2 bg-green-100 px-2 py-0.5 rounded-full`}>
                      <Text style={tw`text-xs font-medium text-green-800`}>
                        {resolvedAlertas.length}
                      </Text>
                    </View>
                  </View>
                  {showResolvedSection ? 
                    <ChevronUp stroke="#22c55e" width={20} height={20} /> : 
                    <ChevronDown stroke="#22c55e" width={20} height={20} />
                  }
                </TouchableOpacity>
                
                {showResolvedSection && resolvedAlertas.map(alerta => (
                  <AlertCard 
                    key={`resolved-${alerta.id}`}
                    alerta={alerta} 
                    producto={getProductoInfo(alerta.id_producto_monitoreado)}
                  />
                ))}
              </View>
            )}
          </>
        )}
        ListFooterComponent={() => (
          <>
            {hasMore && (
              <TouchableOpacity
                onPress={onLoadMore}
                disabled={refreshing}
                style={tw`py-4 px-6 bg-blue-50 rounded-xl mx-4 mb-4 ${refreshing ? 'opacity-50' : ''}`}
              >
                {refreshing ? (
                  <View style={tw`flex-row items-center justify-center`}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={tw`ml-2 text-blue-600 font-medium`}>Cargando...</Text>
                  </View>
                ) : (
                  <View style={tw`flex-row items-center justify-center`}>
                    <Text style={tw`text-blue-600 font-semibold`}>Cargar más alertas</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <View style={tw`h-4`} />
          </>
        )}
        keyExtractor={() => Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-4`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchAlertas}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      />
    );
  };

  return (
    <MainLayout title="Monitoreo de Alertas">
      <View style={tw`flex-1 px-4 pt-4`}>
        {/* Encabezado */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Monitor de Alertas</Text>
          <Text style={tw`text-sm text-gray-500`}>
            {pendingAlertas.length + resolvedAlertas.length} alertas • {pendingAlertas.length} pendientes
          </Text>
        </View>
        
        {/* Selector de fecha */}
        <View style={tw`mb-4`}>
          <TouchableOpacity 
            style={tw`flex-row items-center bg-white rounded-xl shadow-sm px-4 py-3`}
            onPress={() => setShowDatePicker(true)}
          >
            <Clock stroke="#a1a1aa" width={20} height={20} />
            <Text style={tw`flex-1 text-base text-gray-800 ml-2`}>
              {selectedDate ? format(new Date(selectedDate), "dd MMMM yyyy", { locale: es }) : "Todas las fechas"}
            </Text>
            {selectedDate && (
              <TouchableOpacity 
                style={tw`bg-gray-100 rounded-full p-1`}
                onPress={() => setSelectedDate('')}
              >
                <Text style={tw`text-xs font-medium text-gray-700 px-2`}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate ? new Date(selectedDate) : new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        
        {renderContent()}
      </View>
    </MainLayout>
  );
};

export default AlertasScreen;