// src/presentation/screens/CondicionesScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  TextInput,
  RefreshControl
} from 'react-native';
import tw from 'twrnc';
import { Search, AlertTriangle, Thermometer, Droplet, Sun, Wind, ChevronDown, ChevronUp } from 'react-native-feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import MainLayout from '../layouts/MainLayout';
import { useCondiciones } from '../../context/CondicionesContext';

// Interfaz para el componente de detalles expandible
interface ExpandableDetailsProps {
  title: string;
  min: number;
  max: number;
  unit: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

// Componente para mostrar detalles expandibles
const ExpandableDetails: React.FC<ExpandableDetailsProps> = ({ title, min, max, unit, icon, isOpen, onToggle }) => {
  return (
    <View style={tw`border-t border-gray-100 py-2`}>
      <TouchableOpacity 
        style={tw`flex-row justify-between items-center py-2`}
        onPress={onToggle}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`mr-2`}>
            {icon}
          </View>
          <Text style={tw`text-sm font-medium text-gray-700`}>{title}</Text>
        </View>
        {isOpen ? 
          <ChevronUp stroke="#64748b" width={18} height={18} /> : 
          <ChevronDown stroke="#64748b" width={18} height={18} />
        }
      </TouchableOpacity>
      
      {isOpen && (
        <View style={tw`py-2 px-2 bg-gray-50 rounded-lg mt-1`}>
          <Text style={tw`text-sm text-gray-600 leading-5`}>
            Rango permitido: {min} - {max} {unit}
          </Text>
        </View>
      )}
    </View>
  );
};

// Definir tipo para las secciones expandibles
type ExpandableSection = 'temperatura' | 'humedad' | 'lux' | 'presion' | null;

// Interface para las props del CondicionCard
interface CondicionCardProps {
  item: {
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
  };
}

// Componente para cada tarjeta de condición
const CondicionCard: React.FC<CondicionCardProps> = ({ item }) => {
  const [expandedSection, setExpandedSection] = useState<ExpandableSection>(null);

  const toggleSection = (section: ExpandableSection) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <View style={tw`bg-white rounded-xl shadow-md mb-4 overflow-hidden`}>
      <View style={tw`p-4`}>
        {/* Encabezado de la tarjeta */}
        <View style={tw`mb-2`}>
          <Text style={tw`text-lg font-bold text-gray-800`}>{item.nombre}</Text>
          <Text style={tw`text-xs text-gray-500`}>
            Última actualización: {item.fecha_actualizacion}
          </Text>
        </View>
        
        {/* Indicadores principales */}
        <View style={tw`flex-row flex-wrap justify-between mb-4`}>
          <View style={tw`bg-blue-50 p-3 rounded-lg mb-2 w-[48%]`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Thermometer stroke="#3b82f6" width={16} height={16} />
              <Text style={tw`ml-1 text-xs font-medium text-blue-700`}>Temperatura</Text>
            </View>
            <Text style={tw`text-sm font-bold text-blue-800`}>
              {item.temperatura_min}°C - {item.temperatura_max}°C
            </Text>
          </View>

          <View style={tw`bg-teal-50 p-3 rounded-lg mb-2 w-[48%]`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Droplet stroke="#0d9488" width={16} height={16} />
              <Text style={tw`ml-1 text-xs font-medium text-teal-700`}>Humedad</Text>
            </View>
            <Text style={tw`text-sm font-bold text-teal-800`}>
              {item.humedad_min}% - {item.humedad_max}%
            </Text>
          </View>
          
          <View style={tw`bg-amber-50 p-3 rounded-lg mb-2 w-[48%]`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Sun stroke="#d97706" width={16} height={16} />
              <Text style={tw`ml-1 text-xs font-medium text-amber-700`}>Iluminación</Text>
            </View>
            <Text style={tw`text-sm font-bold text-amber-800`}>
              {item.lux_min} - {item.lux_max} lux
            </Text>
          </View>
          
          <View style={tw`bg-blue-50 p-3 rounded-lg mb-2 w-[48%]`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Wind stroke="#3b82f6" width={16} height={16} />
              <Text style={tw`ml-1 text-xs font-medium text-blue-700`}>Presión</Text>
            </View>
            <Text style={tw`text-sm font-bold text-blue-800`}>
              {item.presion_min} - {item.presion_max} hPa
            </Text>
          </View>
        </View>
        
        {/* Secciones expandibles */}
        <View style={tw`mt-2`}>
          <ExpandableDetails 
            title="Detalles de Temperatura" 
            min={item.temperatura_min}
            max={item.temperatura_max}
            unit="°C"
            icon={<Thermometer stroke="#3b82f6" width={16} height={16} />}
            isOpen={expandedSection === 'temperatura'}
            onToggle={() => toggleSection('temperatura')}
          />
          <ExpandableDetails 
            title="Detalles de Humedad" 
            min={item.humedad_min}
            max={item.humedad_max}
            unit="%"
            icon={<Droplet stroke="#0d9488" width={16} height={16} />}
            isOpen={expandedSection === 'humedad'}
            onToggle={() => toggleSection('humedad')}
          />
          <ExpandableDetails 
            title="Detalles de Iluminación" 
            min={item.lux_min}
            max={item.lux_max}
            unit="lux"
            icon={<Sun stroke="#d97706" width={16} height={16} />}
            isOpen={expandedSection === 'lux'}
            onToggle={() => toggleSection('lux')}
          />
          <ExpandableDetails 
            title="Detalles de Presión" 
            min={item.presion_min}
            max={item.presion_max}
            unit="hPa"
            icon={<Wind stroke="#3b82f6" width={16} height={16} />}
            isOpen={expandedSection === 'presion'}
            onToggle={() => toggleSection('presion')}
          />
        </View>
      </View>
    </View>
  );
};

const CondicionesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { 
    condiciones, 
    filteredCondiciones, 
    loading, 
    error, 
    refreshing, 
    searchTerm,
    handleSearch,
    fetchCondiciones 
  } = useCondiciones();

  // Cargar condiciones al montar el componente
  useEffect(() => {
    fetchCondiciones();
  }, []);

  // Contenido principal de la pantalla
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-600`}>Cargando condiciones de almacenamiento...</Text>
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
              onPress={fetchCondiciones}
            >
              <Text style={tw`text-red-700 font-medium`}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (filteredCondiciones.length === 0) {
      return (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <AlertTriangle stroke="#a1a1aa" width={48} height={48} />
          <Text style={tw`mt-4 text-lg font-medium text-gray-700`}>
            No se encontraron condiciones
          </Text>
          <Text style={tw`text-gray-500 text-center mt-1`}>
            {searchTerm ? "Intenta con otra búsqueda" : "No hay condiciones disponibles"}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredCondiciones}
        renderItem={({ item }) => <CondicionCard item={item} />}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-4`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchCondiciones}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      />
    );
  };

  return (
    <MainLayout title="Condiciones de Almacenamiento">
      <View style={tw`flex-1 px-4 pt-4`}>
        {/* Encabezado */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Condiciones de Almacenamiento</Text>
          <Text style={tw`text-sm text-gray-500`}>
            {filteredCondiciones.length} {filteredCondiciones.length === 1 ? 'resultado' : 'resultados'} encontrados
          </Text>
        </View>
        
        {/* Barra de búsqueda */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center bg-white rounded-xl shadow-sm px-3 py-2`}>
            <Search stroke="#a1a1aa" width={20} height={20} />
            <TextInput
              style={tw`flex-1 text-base text-gray-800 ml-2 py-1`}
              placeholder="Buscar condición..."
              placeholderTextColor="#a1a1aa"
              value={searchTerm}
              onChangeText={handleSearch}
            />
          </View>
        </View>
        
        {renderContent()}
      </View>
    </MainLayout>
  );
};

export default CondicionesScreen;