// src/presentation/screens/AgregarMonitoreoScreen.tsx
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
  Modal,
  Alert
} from 'react-native';
import tw from 'twrnc';
import { Search, AlertTriangle, Plus, Package, X, Info } from 'react-native-feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import MainLayout from '../layouts/MainLayout';
import { useProductos } from '../../context/ProductContext';
import { useMonitoreo } from '../../context/MonitoreoContext';

// Interface para producto farmacéutico
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

// Props para ProductCard
interface ProductCardProps {
  item: ProductoFarmaceutico;
  onSelectProduct: (product: ProductoFarmaceutico) => void;
}

// Componente para cada tarjeta de producto
const ProductCard: React.FC<ProductCardProps> = ({ item, onSelectProduct }) => {
  return (
    <TouchableOpacity 
      style={tw`bg-white rounded-xl shadow-md mb-4 overflow-hidden`}
      onPress={() => onSelectProduct(item)}
    >
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
          <View style={tw`flex-1 ml-4`}>
            <Text style={tw`text-lg font-bold text-gray-800`}>{item.nombre}</Text>
            <Text style={tw`text-sm text-gray-600 mb-1`}>Fórmula: {item.formula}</Text>
            <View style={tw`flex-row items-center flex-wrap`}>
              <View style={tw`bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1`}>
                <Text style={tw`text-xs text-blue-700`}>{item.concentracion}</Text>
              </View>
              {item.formafarmaceutica && (
                <View style={tw`bg-purple-100 px-2 py-1 rounded-full mb-1`}>
                  <Text style={tw`text-xs text-purple-700`}>{item.formafarmaceutica}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Botón de monitoreo */}
        <TouchableOpacity 
          style={tw`mt-3 bg-blue-500 py-2 px-4 rounded-lg flex-row items-center justify-center`}
          onPress={() => onSelectProduct(item)}
        >
          <Plus stroke="#ffffff" width={18} height={18} />
          <Text style={tw`text-white font-medium ml-2`}>Monitorear Producto</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const AgregarMonitoreoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Usar los contextos separados
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
  
  const {
    agregarProductoMonitoreado,
    submitLoading,
    submitError
  } = useMonitoreo();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoFarmaceutico | null>(null);
  const [localizacion, setLocalizacion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProductos();
  }, []);

  // Manejar selección de producto
  const handleSelectProduct = (product: ProductoFarmaceutico) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  // Cerrar modal y resetear valores
  const handleCloseModal = () => {
    setModalVisible(false);
    setLocalizacion('');
    setCantidad('');
    setFormError(null);
    setSelectedProduct(null);
  };

  // Enviar formulario de monitoreo usando el contexto de monitoreo
  const handleSubmit = async () => {
    if (!selectedProduct || !selectedProduct.id) return;
    
    // Validaciones básicas
    if (!localizacion.trim()) {
      setFormError('La ubicación es requerida');
      return;
    }
    
    if (!cantidad.trim() || parseInt(cantidad) <= 0) {
      setFormError('La cantidad debe ser mayor a 0');
      return;
    }
    
    setFormError(null);
    
    // Usar la función del contexto de monitoreo
    const success = await agregarProductoMonitoreado({
      id_producto: selectedProduct.id,
      localizacion,
      cantidad: parseInt(cantidad),
      fecha_inicio_monitoreo: new Date().toISOString()
    });
    
    if (success) {
      handleCloseModal();
      
      // Mostrar mensaje de éxito
      Alert.alert(
        "Producto Monitoreado",
        `${selectedProduct.nombre} ha sido agregado al monitoreo exitosamente.`,
        [{ text: "OK" }]
      );
      
      // Opcionalmente, navegar a la pantalla de monitoreo
      // navigation.navigate('Monitoreo');
    }
  };

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
          <Package stroke="#a1a1aa" width={48} height={48} />
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
        renderItem={({ item }) => <ProductCard item={item} onSelectProduct={handleSelectProduct} />}
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
    <MainLayout title="Agregar a Monitoreo">
      <View style={tw`flex-1 px-4 pt-4`}>
        {/* Encabezado */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Agregar a Monitoreo</Text>
          <Text style={tw`text-sm text-gray-500`}>
            Selecciona un producto para monitorear
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
        
        {/* Modal para configurar monitoreo */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={tw`flex-1 justify-end bg-black bg-opacity-50`}>
            <View style={tw`bg-white rounded-t-3xl shadow-xl p-6`}>
              {/* Encabezado del modal */}
              <View style={tw`flex-row justify-between items-center mb-6`}>
                <View style={tw`flex-row items-center`}>
                  <Info stroke="#3b82f6" width={24} height={24} />
                  <Text style={tw`text-xl font-bold text-gray-800 ml-2`}>Configurar Monitoreo</Text>
                </View>
                <TouchableOpacity onPress={handleCloseModal}>
                  <X stroke="#64748b" width={24} height={24} />
                </TouchableOpacity>
              </View>
              
              {/* Información del producto seleccionado */}
              {selectedProduct && (
                <View style={tw`flex-row mb-6`}>
                  <View style={tw`w-20 h-20 bg-blue-50 rounded-lg overflow-hidden`}>
                    {selectedProduct.foto ? (
                      <Image
                        source={{ uri: selectedProduct.foto }}
                        style={tw`w-full h-full`}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={tw`w-full h-full items-center justify-center`}>
                        <Package stroke="#3b82f6" width={32} height={32} />
                      </View>
                    )}
                  </View>
                  <View style={tw`ml-4 flex-1`}>
                    <Text style={tw`text-lg font-bold text-gray-800`}>
                      {selectedProduct.nombre}
                    </Text>
                    <Text style={tw`text-sm text-gray-600`}>
                      {selectedProduct.formula}
                    </Text>
                    <Text style={tw`text-sm text-gray-600`}>
                      {selectedProduct.concentracion}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Línea divisoria */}
              <View style={tw`h-0.5 bg-gray-100 mb-6`} />
              
              {/* Campos del formulario */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>
                  Ubicación en almacén
                </Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800`}
                  placeholder="Ej: Estante A, Sección 2"
                  value={localizacion}
                  onChangeText={setLocalizacion}
                />
              </View>
              
              <View style={tw`mb-6`}>
                <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>
                  Cantidad inicial
                </Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800`}
                  placeholder="Ej: 100"
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="numeric"
                />
              </View>
              
              {/* Error message - prioriza los errores del formulario y luego los errores del submit */}
              {(formError || submitError) && (
                <View style={tw`mb-4 bg-red-50 p-3 rounded-lg`}>
                  <Text style={tw`text-red-600`}>{formError || submitError}</Text>
                </View>
              )}
              
              {/* Botones de acción */}
              <View style={tw`flex-row space-x-3`}>
                <TouchableOpacity
                  style={tw`flex-1 border border-gray-300 rounded-lg py-3 flex-row justify-center items-center`}
                  onPress={handleCloseModal}
                >
                  <X stroke="#64748b" width={18} height={18} />
                  <Text style={tw`ml-2 font-medium text-gray-700`}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={tw`flex-1 bg-blue-500 rounded-lg py-3 flex-row justify-center items-center`}
                  onPress={handleSubmit}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Plus stroke="#ffffff" width={18} height={18} />
                      <Text style={tw`ml-2 font-medium text-white`}>Iniciar Monitoreo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </MainLayout>
  );
};

export default AgregarMonitoreoScreen;