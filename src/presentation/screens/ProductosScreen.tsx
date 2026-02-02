// src/presentation/screens/ProductosScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  SafeAreaView, 
  TextInput,
  RefreshControl
} from 'react-native';
import tw from 'twrnc';
import { Search, AlertTriangle, ShoppingBag, Package, ChevronDown, ChevronUp } from 'react-native-feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import MainLayout from '../layouts/MainLayout';
import { useProductos } from '../../context/ProductContext';

// Interfaz para el componente de detalles expandible
interface ExpandableDetailsProps {
  title: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}

// Componente para mostrar detalles expandibles
const ExpandableDetails: React.FC<ExpandableDetailsProps> = ({ title, content, isOpen, onToggle }) => {
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
          <Text style={tw`text-sm text-gray-600 leading-5`}>
            {content || "No disponible"}
          </Text>
        </View>
      )}
    </View>
  );
};

// Definir tipo para las secciones expandibles
type ExpandableSection = 'indicaciones' | 'contraindicaciones' | 'efectos' | null;

// Interface para las props del ProductCard
interface ProductCardProps {
  item: {
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
  };
}

// Componente para cada tarjeta de producto
const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
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
        <View style={tw`flex-row`}>
          {/* Imagen del producto */}
          <View style={tw`w-20 h-20 bg-blue-50 rounded-lg overflow-hidden`}>
            {item.foto ? (
              <Image
                source={{ uri: item.foto }}
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
          <View style={tw`flex-1 ml- 4`}>
            <Text style={tw`text-lg font-bold text-gray-800`}>{item.nombre}</Text>
            <Text style={tw`text-sm text-gray-600 mb-1`}>Fórmula: {item.formula}</Text>
            <View style={tw`flex-row items-center`}>
              <View style={tw`bg-blue-100 px-2 py-1 rounded-full mr-2`}>
                <Text style={tw`text-xs text-blue-700`}>{item.concentracion}</Text>
              </View>
              <View style={tw`bg-purple-100 px-2 py-1 rounded-full`}>
                <Text style={tw`text-xs text-purple-700`}>{item.formafarmaceutica}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Condiciones de almacenamiento */}
        <View style={tw`mt-3 bg-amber-50 p-3 rounded-lg`}>
          <Text style={tw`text-xs font-medium text-amber-800`}>Condiciones de almacenamiento:</Text>
          <Text style={tw`text-xs text-amber-700 mt-1`}>{item.condicion}</Text>
        </View>
        
        {/* Secciones expandibles */}
        <View style={tw`mt-2`}>
          <ExpandableDetails 
            title="Indicaciones" 
            content={item.indicaciones}
            isOpen={expandedSection === 'indicaciones'}
            onToggle={() => toggleSection('indicaciones')}
          />
          <ExpandableDetails 
            title="Contraindicaciones" 
            content={item.contraindicaciones}
            isOpen={expandedSection === 'contraindicaciones'}
            onToggle={() => toggleSection('contraindicaciones')}
          />
          <ExpandableDetails 
            title="Efectos secundarios" 
            content={item.efectos_secundarios}
            isOpen={expandedSection === 'efectos'}
            onToggle={() => toggleSection('efectos')}
          />
        </View>
      </View>
    </View>
  );
};

const ProductosScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { 
    productos, 
    filteredProductos, 
    loading, 
    error, 
    refreshing, 
    searchTerm,
    handleSearch,
    fetchProductos 
  } = useProductos();

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProductos();
  }, []);

  // Contenido principal de la pantalla
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-600`}>Cargando productos...</Text>
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
              onPress={fetchProductos}
            >
              <Text style={tw`text-red-700 font-medium`}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (filteredProductos.length === 0) {
      return (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <ShoppingBag stroke="#a1a1aa" width={48} height={48} />
          <Text style={tw`mt-4 text-lg font-medium text-gray-700`}>
            No se encontraron productos
          </Text>
          <Text style={tw`text-gray-500 text-center mt-1`}>
            {searchTerm ? "Intenta con otra búsqueda" : "No hay productos disponibles"}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredProductos}
        renderItem={({ item }) => <ProductCard item={item} />}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-4`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchProductos}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      />
    );
  };

  return (
    <MainLayout title="Productos Farmacéuticos">
      <View style={tw`flex-1 px-4 pt-4`}>
        {/* Encabezado */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Productos Farmacéuticos</Text>
          <Text style={tw`text-sm text-gray-500`}>
            {filteredProductos.length} {filteredProductos.length === 1 ? 'resultado' : 'resultados'} encontrados
          </Text>
        </View>
        
        {/* Barra de búsqueda */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center bg-white rounded-xl shadow-sm px-3 py-2`}>
            <Search stroke="#a1a1aa" width={20} height={20} />
            <TextInput
              style={tw`flex-1 text-base text-gray-800 ml-2 py-1`}
              placeholder="Buscar producto..."
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

export default ProductosScreen;