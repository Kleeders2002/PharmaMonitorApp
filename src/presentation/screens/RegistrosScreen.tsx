// src/presentation/screens/RegistrosScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  TextInput,
  RefreshControl,
  ScrollView,
  Dimensions
} from 'react-native';
import tw from 'twrnc';
import { Search, AlertTriangle, User, Calendar, ChevronDown, ChevronUp, Clock, AlertCircle, Plus, Check } from 'react-native-feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import MainLayout from '../layouts/MainLayout';
import { useRegistros, filterOptions, Registro } from '../../context/RegistroContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Componente para renderizar cada elemento del filtro
const FilterItem = ({ 
  item, 
  isSelected, 
  onSelect 
}: { 
  item: { value: string, label: string }, 
  isSelected: boolean, 
  onSelect: () => void 
}) => {
  return (
    <TouchableOpacity
      style={tw`px-3 py-2 rounded-full mr-2 ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}
      onPress={onSelect}
    >
      <Text style={tw`text-xs font-medium ${isSelected ? 'text-blue-800' : 'text-gray-600'}`}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

// Componente para mostrar detalles expandibles
interface ExpandableDetailsProps {
  title: string;
  detalles: Record<string, any>;
  isOpen: boolean;
  onToggle: () => void;
}

const ExpandableDetails: React.FC<ExpandableDetailsProps> = ({ title, detalles, isOpen, onToggle }) => {
  return (
    <View style={tw`border-t border-gray-100 py-2`}>
      <TouchableOpacity 
        style={tw`flex-row justify-between items-center py-2`}
        onPress={onToggle}
      >
        <Text style={tw`text-sm font-medium text-gray-700`}>{title}</Text>
        {isOpen ? 
          <ChevronUp stroke="#64748b" width={18} height={18} /> : 
          <ChevronDown stroke="#64748b" width={18} height={18} />
        }
      </TouchableOpacity>
      
      {isOpen && (
        <View style={tw`py-2 px-2 bg-gray-50 rounded-lg mt-1`}>
          {Object.entries(detalles).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return (
                <View key={key} style={tw`ml-4 border-l-2 border-gray-200 pl-2 mb-2`}>
                  <Text style={tw`text-sm font-medium text-gray-700`}>{capitalizeFirstLetter(key.replace(/_/g, ' '))}:</Text>
                  {renderNestedDetails(value)}
                </View>
              );
            }
            
            // Formatear fechas
            let displayValue = value;
            if (typeof value === 'string' && (key.toLowerCase().includes('fecha') || /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))) {
              try {
                displayValue = format(parseISO(value), "dd MMM yyyy HH:mm", { locale: es });
              } catch (e) {
                // Si no es una fecha válida, mantener el valor original
              }
            }
            
            // Mostrar imágenes pequeñas para campos con fotos
            if (key.toLowerCase() === 'foto' && typeof value === 'string') {
              return (
                <View key={key} style={tw`flex-row items-center my-1`}>
                  <Text style={tw`text-xs font-medium text-gray-700 mr-2`}>
                    {capitalizeFirstLetter(key.replace(/_/g, ' '))}:
                  </Text>
                  <Image 
                    source={{ uri: value }} 
                    style={tw`w-6 h-6 rounded-full`} 
                    resizeMode="cover"
                  />
                </View>
              );
            }
            
            return (
              <View key={key} style={tw`flex-row my-1`}>
                <Text style={tw`text-xs font-medium text-gray-700 mr-2`}>
                  {capitalizeFirstLetter(key.replace(/_/g, ' '))}:
                </Text>
                <Text style={tw`text-xs text-gray-600 flex-1`}>
                  {String(displayValue)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

// Función auxiliar para renderizar detalles anidados
const renderNestedDetails = (details: Record<string, any>) => {
  return Object.entries(details).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <View key={key} style={tw`ml-2 mb-1`}>
          <Text style={tw`text-xs font-medium text-gray-700`}>{capitalizeFirstLetter(key.replace(/_/g, ' '))}:</Text>
          {renderNestedDetails(value)}
        </View>
      );
    }
    
    return (
      <View key={key} style={tw`flex-row my-1 ml-2`}>
        <Text style={tw`text-xs font-medium text-gray-700 mr-1`}>
          {capitalizeFirstLetter(key.replace(/_/g, ' '))}:
        </Text>
        <Text style={tw`text-xs text-gray-600 flex-1`}>{String(value)}</Text>
      </View>
    );
  });
};

// Componente para cada tarjeta de registro
interface RegistroCardProps {
  item: Registro;
}

const RegistroCard: React.FC<RegistroCardProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getBadgeColor = (operation: string) => {
    switch (operation.toLowerCase()) {
      case 'crear': return 'bg-green-100 text-green-800';
      case 'actualizar': return 'bg-blue-100 text-blue-800';
      case 'eliminar': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeIcon = (operation: string) => {
    switch (operation.toLowerCase()) {
      case 'crear': return <Plus stroke="#065f46" width={14} height={14} />;
      case 'actualizar': return <Check stroke="#1e40af" width={14} height={14} />;
      case 'eliminar': return <AlertCircle stroke="#991b1b" width={14} height={14} />;
      default: return null;
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <View style={tw`bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100`}>
      <View style={tw`p-4`}>
        {/* Encabezado de la tarjeta */}
        <View style={tw`flex-row justify-between items-center`}>
          {/* Información del usuario */}
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-10 h-10 bg-blue-100 rounded-full items-center justify-center`}>
              <Text style={tw`text-lg font-bold text-blue-600`}>
                {item.nombre_usuario[0]}
              </Text>
            </View>
            
            <View style={tw`ml-3`}>
              <Text style={tw`text-sm font-bold text-gray-800`}>{item.nombre_usuario}</Text>
              <Text style={tw`text-xs text-gray-500`}>{item.rol_usuario}</Text>
            </View>
          </View>
          
          {/* Tipo de operación */}
          <View style={tw`flex-row items-center ${getBadgeColor(item.tipo_operacion)} px-3 py-1 rounded-full`}>
            {getBadgeIcon(item.tipo_operacion)}
            <Text style={tw`text-xs font-medium ml-1`}>
              {capitalizeFirstLetter(item.tipo_operacion)}
            </Text>
          </View>
        </View>
        
        {/* Información de fecha y entidad */}
        <View style={tw`mt-3 bg-gray-50 p-3 rounded-lg`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Calendar stroke="#6b7280" width={14} height={14} />
            <Text style={tw`text-xs text-gray-600 ml-2`}>
              {format(parseISO(item.fecha), "dd MMMM yyyy", { locale: es })}
            </Text>
            <View style={tw`mx-2 w-1 h-1 bg-gray-300 rounded-full`} />
            <Clock stroke="#6b7280" width={14} height={14} />
            <Text style={tw`text-xs text-gray-600 ml-2`}>
              {format(parseISO(item.fecha), "HH:mm:ss", { locale: es })}
            </Text>
          </View>
          
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-xs font-medium text-gray-700`}>Entidad afectada: </Text>
            <Text style={tw`text-xs text-gray-600`}>{item.entidad_afectada}</Text>
          </View>
        </View>
        
        {/* Botón para expandir detalles */}
        <ExpandableDetails
          title="Detalles de la operación"
          detalles={item.detalles}
          isOpen={isExpanded}
          onToggle={toggleExpand}
        />
      </View>
    </View>
  );
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const RegistrosScreen: React.FC = () => {
  const { 
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
  } = useRegistros();
  
  // Cargar registros al montar el componente
  useEffect(() => {
    fetchRegistros();
  }, []);
  
  // Calcular registros a mostrar basados en la página actual
  const recordsPerPage = 10;
  const recordsToShow = filteredRegistros.slice(0, currentPage * recordsPerPage);
  const hasMore = recordsToShow.length < filteredRegistros.length;
  
  // Función para renderizar la barra de filtros
  const renderFilterBar = () => {
    return (
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`py-2`}
      >
        {filterOptions.map((option) => (
          <FilterItem
            key={option.value}
            item={option}
            isSelected={selectedFilter === option.value}
            onSelect={() => setSelectedFilter(option.value)}
          />
        ))}
      </ScrollView>
    );
  };

  // Contenido principal de la pantalla
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-600`}>Cargando registros del sistema...</Text>
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
              onPress={fetchRegistros}
            >
              <Text style={tw`text-red-700 font-medium`}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (filteredRegistros.length === 0) {
      return (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <AlertCircle stroke="#a1a1aa" width={48} height={48} />
          <Text style={tw`mt-4 text-lg font-medium text-gray-700`}>
            No se encontraron registros
          </Text>
          <Text style={tw`text-gray-500 text-center mt-1`}>
            {searchTerm ? "Intenta con otra búsqueda" : "No hay registros disponibles"}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={recordsToShow}
        renderItem={({ item }) => <RegistroCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-4`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchRegistros}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={tw`bg-blue-50 py-3 rounded-lg items-center mt-2`}
              onPress={loadMore}
            >
              <Text style={tw`text-blue-600 font-medium`}>Cargar más registros</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    );
  };

  return (
    <MainLayout title="Registros del Sistema">
      <View style={tw`flex-1 px-4 pt-4`}>
        {/* Encabezado */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Registros del Sistema</Text>
          <Text style={tw`text-sm text-gray-500`}>
            {filteredRegistros.length} {filteredRegistros.length === 1 ? 'registro' : 'registros'} encontrados
          </Text>
        </View>
        
        {/* Barra de búsqueda */}
        <View style={tw`mb-3`}>
          <View style={tw`flex-row items-center bg-white rounded-xl shadow-sm px-3 py-2 border border-gray-100`}>
            <Search stroke="#a1a1aa" width={20} height={20} />
            <TextInput
              style={tw`flex-1 text-base text-gray-800 ml-2 py-1`}
              placeholder="Buscar registros..."
              placeholderTextColor="#a1a1aa"
              value={searchTerm}
              onChangeText={handleSearch}
            />
          </View>
        </View>
        
        {/* Filtros */}
        <View style={tw`mb-4`}>
          {renderFilterBar()}
        </View>
        
        {renderContent()}
      </View>
    </MainLayout>
  );
};

export default RegistrosScreen;