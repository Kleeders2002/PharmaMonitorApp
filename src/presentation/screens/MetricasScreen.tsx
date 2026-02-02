// // src/presentation/screens/MetricasScreen.tsx
// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   TouchableOpacity, 
//   FlatList, 
//   ActivityIndicator, 
//   SafeAreaView, 
//   RefreshControl,
//   ScrollView
// } from 'react-native';
// import tw from 'twrnc';
// import { 
//   AlertTriangle, 
//   Thermometer, 
//   Droplet, 
//   Sun, 
//   AlertCircle,
//   Box,
//   MapPin,
//   Calendar,
//   Clock,
//   StopCircle,
//   ChevronDown, 
//   ChevronUp 
// } from 'react-native-feather';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../navigation/types';
// import { useNavigation } from '@react-navigation/native';
// import MainLayout from '../layouts/MainLayout';
// import { useMonitoreo } from '../../context/MonitoreoContext';

// // Interfaces
// interface MonitoringData {
//   id: number;
//   id_producto_monitoreado: number;
//   fecha: string;
//   humedad: number;
//   presion: number;
//   temperatura: number;
//   lux: number;
// }

// interface ProductoMonitoreado {
//   id: number;
//   id_producto: number;
//   cantidad: number;
//   localizacion: string;
//   fecha_inicio_monitoreo: string;
//   fecha_finalizacion_monitoreo?: string;
//   nombre_producto: string;
//   foto_producto: string;
//   temperatura_min: number;
//   temperatura_max: number;
//   humedad_min: number;
//   humedad_max: number;
//   lux_min: number;
//   lux_max: number;
//   presion_min: number;
//   presion_max: number;
// }

// // Componente para detalles expandibles
// const ExpandableDetails: React.FC<{
//   title: string;
//   content: string;
//   isOpen: boolean;
//   onToggle: () => void;
// }> = ({ title, content, isOpen, onToggle }) => {
//   return (
//     <View style={tw`border-t border-gray-100 py-2`}>
//       <TouchableOpacity 
//         style={tw`flex-row justify-between items-center py-2`}
//         onPress={onToggle}
//       >
//         <Text style={tw`text-sm font-medium text-gray-700`}>{title}</Text>
//         {isOpen ? 
//           <ChevronUp stroke="#64748b" width={18} height={18} /> : 
//           <ChevronDown stroke="#64748b" width={18} height={18} />
//         }
//       </TouchableOpacity>
      
//       {isOpen && (
//         <View style={tw`py-2 px-2 bg-gray-50 rounded-lg mt-1`}>
//           <Text style={tw`text-sm text-gray-600 leading-5`}>
//             {content || "No disponible"}
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// };

// // Componente de tarjeta de métrica
// const MetricCard: React.FC<{
//   metric: 'temperatura' | 'humedad' | 'lux' | 'presion';
//   currentValue: number;
//   min: number;
//   max: number;
//   isOutOfRange: boolean;
//   trend: number;
//   onPress: () => void;
//   isSelected: boolean;
// }> = ({ metric, currentValue, min, max, isOutOfRange, trend, onPress, isSelected }) => {
//   const metricColors = {
//     temperatura: { bg: "bg-orange-100", text: "text-orange-600", icon: Thermometer },
//     humedad: { bg: "bg-blue-100", text: "text-blue-600", icon: Droplet },
//     lux: { bg: "bg-yellow-100", text: "text-yellow-600", icon: Sun },
//     presion: { bg: "bg-purple-100", text: "text-purple-600", icon: AlertCircle },
//   };

//   const Icon = metricColors[metric].icon;
//   const unit = metric === 'temperatura' ? '°C' : metric === 'humedad' ? '%' : metric === 'lux' ? 'lux' : 'hPa';

//   return (
//     <TouchableOpacity
//       onPress={onPress}
//       style={[
//         tw`bg-white rounded-xl p-4 mb-3 shadow-sm`,
//         isSelected && tw`border-2 border-blue-500`,
//         isOutOfRange && tw`border-2 border-red-500`
//       ]}
//     >
//       <View style={tw`flex-row justify-between items-start`}>
//         <View style={tw`flex-row items-center`}>
//           <View style={tw`p-2 rounded-lg ${metricColors[metric].bg}`}>
//             <Icon stroke={metricColors[metric].text.replace('text-', '')} width={20} height={20} />
//           </View>
//           <Text style={tw`ml-2 text-gray-600 font-medium`}>
//             {metric === 'lux' ? 'Luz' : metric.charAt(0).toUpperCase() + metric.slice(1)}
//           </Text>
//         </View>
        
//         {isOutOfRange && (
//           <View style={tw`bg-red-100 px-2 py-1 rounded-full`}>
//             <Text style={tw`text-xs text-red-700`}>Alerta</Text>
//           </View>
//         )}
//       </View>
      
//       <View style={tw`mt-2`}>
//         <View style={tw`flex-row items-baseline`}>
//           <Text style={tw`text-2xl font-bold`}>{currentValue.toFixed(1)}</Text>
//           <Text style={tw`text-gray-500 ml-1`}>{unit}</Text>
//           <Text style={[
//             tw`text-sm ml-2`,
//             trend >= 0 ? tw`text-green-600` : tw`text-red-600`
//           ]}>
//             {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
//           </Text>
//         </View>
        
//         <View style={tw`w-full bg-gray-100 rounded-full h-2 mt-2`}>
//           <View 
//             style={[
//               tw`h-2 rounded-full ${metricColors[metric].bg}`,
//               { width: `${((currentValue - min) / (max - min)) * 100}%` }
//             ]}
//           />
//         </View>
        
//         <View style={tw`flex-row justify-between mt-1`}>
//           <Text style={tw`text-xs text-gray-500`}>Mín: {min}</Text>
//           <Text style={tw`text-xs text-gray-500`}>Máx: {max}</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const MetricasScreen = () => {
//   const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const { 
//     productosMonitoreados,
//     loading,
//     error,
//     refreshing,
//     fetchProductosMonitoreados
//   } = useMonitoreo();
  
//   const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
//   const [selectedMetric, setSelectedMetric] = useState<'temperatura' | 'humedad' | 'lux' | 'presion'>('temperatura');
//   const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
//   const [expandedSection, setExpandedSection] = useState<'especificaciones' | null>(null);
  
//   // Separar productos activos e históricos
//   const activeProducts = productosMonitoreados.filter(p => !p.fecha_finalizacion_monitoreo);
//   const historicalProducts = productosMonitoreados.filter(p => p.fecha_finalizacion_monitoreo);
//   const [activeTab, setActiveTab] = useState<'active' | 'historical'>('active');

//   // Cargar datos iniciales
//   useEffect(() => {
//     fetchProductosMonitoreados();
//   }, []);

//   // Simular datos de monitoreo (en una app real, esto vendría de una API)
//   useEffect(() => {
//     if (selectedProduct) {
//       const interval = setInterval(() => {
//         const newData: MonitoringData = {
//           id: Math.random(),
//           id_producto_monitoreado: selectedProduct,
//           fecha: new Date().toISOString(),
//           temperatura: 20 + Math.random() * 10,
//           humedad: 40 + Math.random() * 30,
//           lux: 100 + Math.random() * 500,
//           presion: 900 + Math.random() * 100
//         };
//         setMonitoringData(prev => [...prev.slice(-29), newData]);
//       }, 5000);

//       return () => clearInterval(interval);
//     }
//   }, [selectedProduct]);

//   const currentProduct = activeProducts.find(p => p.id === selectedProduct);
//   const currentData = monitoringData[monitoringData.length - 1];
  
//   // Calcular tendencia
//   const getTrend = (metric: keyof MonitoringData) => {
//     if (monitoringData.length < 2) return 0;
//     const current = monitoringData[monitoringData.length - 1][metric] as number;
//     const previous = monitoringData[monitoringData.length - 2][metric] as number;
//     return current - previous;
//   };

//   // Verificar si está fuera de rango
//   const isOutOfRange = (metric: keyof MonitoringData) => {
//     if (!currentProduct || !currentData) return false;
//     const value = currentData[metric] as number;
//     const min = currentProduct[`${metric}_min` as keyof ProductoMonitoreado] as number;
//     const max = currentProduct[`${metric}_max` as keyof ProductoMonitoreado] as number;
//     return value < min || value > max;
//   };

//   const renderContent = () => {
//     if (loading && !refreshing) {
//       return (
//         <View style={tw`flex-1 justify-center items-center`}>
//           <ActivityIndicator size="large" color="#3b82f6" />
//           <Text style={tw`mt-4 text-gray-600`}>Cargando métricas...</Text>
//         </View>
//       );
//     }

//     if (error) {
//       return (
//         <View style={tw`flex-1 justify-center items-center p-6`}>
//           <View style={tw`bg-red-50 p-6 rounded-2xl w-full items-center`}>
//             <AlertTriangle stroke="#ef4444" width={40} height={40} />
//             <Text style={tw`mt-3 text-lg font-bold text-red-600`}>Error de carga</Text>
//             <Text style={tw`text-red-500 text-center mt-1`}>{error}</Text>
//             <TouchableOpacity
//               style={tw`mt-4 bg-red-100 px-4 py-2 rounded-lg`}
//               onPress={fetchProductosMonitoreados}
//             >
//               <Text style={tw`text-red-700 font-medium`}>Reintentar</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       );
//     }

//     if (activeTab === 'active') {
//       if (activeProducts.length === 0) {
//         return (
//           <View style={tw`flex-1 justify-center items-center p-6`}>
//             <Box stroke="#a1a1aa" width={48} height={48} />
//             <Text style={tw`mt-4 text-lg font-medium text-gray-700`}>
//               No hay productos en monitoreo activo
//             </Text>
//             <Text style={tw`text-gray-500 text-center mt-1`}>
//               Agrega productos para comenzar el monitoreo
//             </Text>
//           </View>
//         );
//       }

//       return (
//         <ScrollView showsVerticalScrollIndicator={false}>
//           {/* Selector de producto */}
//           <View style={tw`mb-4`}>
//             <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>Producto monitoreado</Text>
//             <View style={tw`flex-row flex-wrap gap-2`}>
//               {activeProducts.map(product => (
//                 <TouchableOpacity
//                   key={product.id}
//                   onPress={() => setSelectedProduct(product.id)}
//                   style={[
//                     tw`px-4 py-2 rounded-full border border-gray-200`,
//                     selectedProduct === product.id && tw`bg-blue-50 border-blue-200`
//                   ]}
//                 >
//                   <Text style={[
//                     tw`text-sm`,
//                     selectedProduct === product.id ? tw`text-blue-700` : tw`text-gray-600`
//                   ]}>
//                     {product.nombre_producto}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>

//           {selectedProduct && currentProduct && (
//             <>
//               {/* Información del producto */}
//               <View style={tw`bg-white rounded-xl shadow-sm p-4 mb-4`}>
//                 <View style={tw`flex-row`}>
//                   <Image
//                     source={{ uri: currentProduct.foto_producto || 'https://via.placeholder.com/80' }}
//                     style={tw`w-20 h-20 rounded-lg`}
//                     resizeMode="cover"
//                   />
//                   <View style={tw`ml-4 flex-1`}>
//                     <Text style={tw`text-lg font-bold text-gray-800`}>{currentProduct.nombre_producto}</Text>
//                     <View style={tw`flex-row items-center mt-1`}>
//                       <MapPin stroke="#64748b" width={14} height={14} />
//                       <Text style={tw`text-sm text-gray-600 ml-1`}>{currentProduct.localizacion}</Text>
//                     </View>
//                     <View style={tw`flex-row items-center mt-1`}>
//                       <Box stroke="#64748b" width={14} height={14} />
//                       <Text style={tw`text-sm text-gray-600 ml-1`}>{currentProduct.cantidad} unidades</Text>
//                     </View>
//                     <View style={tw`flex-row items-center mt-1`}>
//                       <Calendar stroke="#64748b" width={14} height={14} />
//                       <Text style={tw`text-sm text-gray-600 ml-1`}>
//                         Monitoreo desde: {new Date(currentProduct.fecha_inicio_monitoreo).toLocaleDateString()}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>

//                 {/* Especificaciones expandibles */}
//                 <ExpandableDetails
//                   title="Especificaciones"
//                   content={`
//                     Temperatura: ${currentProduct.temperatura_min}°C - ${currentProduct.temperatura_max}°C
//                     Humedad: ${currentProduct.humedad_min}% - ${currentProduct.humedad_max}%
//                     Luz: ${currentProduct.lux_min} - ${currentProduct.lux_max} lux
//                     Presión: ${currentProduct.presion_min} - ${currentProduct.presion_max} hPa
//                   `}
//                   isOpen={expandedSection === 'especificaciones'}
//                   onToggle={() => 
//                     setExpandedSection(expandedSection === 'especificaciones' ? null : 'especificaciones')
//                   }
//                 />
//               </View>

//               {/* Tarjetas de métricas */}
//               <View style={tw`mb-4`}>
//                 <Text style={tw`text-lg font-bold text-gray-800 mb-2`}>Métricas en tiempo real</Text>
//                 <View style={tw`grid grid-cols-2 gap-3`}>
//                   <MetricCard
//                     metric="temperatura"
//                     currentValue={currentData?.temperatura || 0}
//                     min={currentProduct.temperatura_min}
//                     max={currentProduct.temperatura_max}
//                     isOutOfRange={isOutOfRange('temperatura')}
//                     trend={getTrend('temperatura')}
//                     onPress={() => setSelectedMetric('temperatura')}
//                     isSelected={selectedMetric === 'temperatura'}
//                   />
//                   <MetricCard
//                     metric="humedad"
//                     currentValue={currentData?.humedad || 0}
//                     min={currentProduct.humedad_min}
//                     max={currentProduct.humedad_max}
//                     isOutOfRange={isOutOfRange('humedad')}
//                     trend={getTrend('humedad')}
//                     onPress={() => setSelectedMetric('humedad')}
//                     isSelected={selectedMetric === 'humedad'}
//                   />
//                   <MetricCard
//                     metric="lux"
//                     currentValue={currentData?.lux || 0}
//                     min={currentProduct.lux_min}
//                     max={currentProduct.lux_max}
//                     isOutOfRange={isOutOfRange('lux')}
//                     trend={getTrend('lux')}
//                     onPress={() => setSelectedMetric('lux')}
//                     isSelected={selectedMetric === 'lux'}
//                   />
//                   <MetricCard
//                     metric="presion"
//                     currentValue={currentData?.presion || 0}
//                     min={currentProduct.presion_min}
//                     max={currentProduct.presion_max}
//                     isOutOfRange={isOutOfRange('presion')}
//                     trend={getTrend('presion')}
//                     onPress={() => setSelectedMetric('presion')}
//                     isSelected={selectedMetric === 'presion'}
//                   />
//                 </View>
//               </View>

//               {/* Gráfico (simulado) */}
//               <View style={tw`bg-white rounded-xl shadow-sm p-4`}>
//                 <Text style={tw`text-lg font-bold text-gray-800 mb-2`}>
//                   Historial de {selectedMetric === 'lux' ? 'Luz' : selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
//                 </Text>
//                 <View style={tw`h-60 bg-gray-50 rounded-lg items-center justify-center`}>
//                   <Text style={tw`text-gray-400`}>Gráfico de {selectedMetric}</Text>
//                   <Text style={tw`text-gray-400 mt-2`}>(Simulado - en una implementación real se usaría una librería como react-native-chart-kit)</Text>
//                 </View>
//               </View>
//             </>
//           )}
//         </ScrollView>
//       );
//     } else {
//       // Pestaña histórica
//       return (
//         <FlatList
//           data={historicalProducts}
//           keyExtractor={(item) => item.id.toString()}
//           contentContainerStyle={tw`p-4`}
//           renderItem={({ item }) => (
//             <View style={tw`bg-white rounded-xl shadow-sm p-4 mb-3`}>
//               <View style={tw`flex-row`}>
//                 <Image
//                   source={{ uri: item.foto_producto || 'https://via.placeholder.com/80' }}
//                   style={tw`w-16 h-16 rounded-lg`}
//                   resizeMode="cover"
//                 />
//                 <View style={tw`ml-3 flex-1`}>
//                   <Text style={tw`font-bold text-gray-800`}>{item.nombre_producto}</Text>
//                   <View style={tw`flex-row items-center mt-1`}>
//                     <MapPin stroke="#64748b" width={14} height={14} />
//                     <Text style={tw`text-sm text-gray-600 ml-1`}>{item.localizacion}</Text>
//                   </View>
//                   <View style={tw`flex-row items-center mt-1`}>
//                     <Calendar stroke="#64748b" width={14} height={14} />
//                     <Text style={tw`text-sm text-gray-600 ml-1`}>
//                       {new Date(item.fecha_inicio_monitoreo).toLocaleDateString()} -{' '}
//                       {item.fecha_finalizacion_monitoreo ? 
//                         new Date(item.fecha_finalizacion_monitoreo).toLocaleDateString() : 'Presente'}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={tw`bg-red-100 px-2 py-1 rounded-full self-start`}>
//                   <Text style={tw`text-xs text-red-700`}>Finalizado</Text>
//                 </View>
//               </View>
//               <TouchableOpacity
//                 style={tw`mt-3 bg-blue-50 py-2 rounded-lg flex-row items-center justify-center`}
//                 onPress={() => navigation.navigate('HistoricoMetricas', { productId: item.id })}
//               >
//                 <Clock stroke="#3b82f6" width={16} height={16} />
//                 <Text style={tw`text-blue-700 ml-2`}>Ver histórico completo</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//           ListEmptyComponent={
//             <View style={tw`flex-1 justify-center items-center p-6`}>
//               <Box stroke="#a1a1aa" width={48} height={48} />
//               <Text style={tw`mt-4 text-lg font-medium text-gray-700`}>
//                 No hay registros históricos
//               </Text>
//               <Text style={tw`text-gray-500 text-center mt-1`}>
//                 Los productos monitoreados aparecerán aquí una vez finalizados
//               </Text>
//             </View>
//           }
//         />
//       );
//     }
//   };

//   return (
//     <MainLayout title="Monitor de Métricas">
//       <View style={tw`flex-1 px-4 pt-4`}>
//         {/* Encabezado */}
//         <View style={tw`mb-4`}>
//           <Text style={tw`text-2xl font-bold text-gray-800`}>Monitor de Métricas</Text>
//           <Text style={tw`text-sm text-gray-500`}>
//             {activeTab === 'active' ? 
//               `${activeProducts.length} en monitoreo activo` : 
//               `${historicalProducts.length} registros históricos`}
//           </Text>
//         </View>
        
//         {/* Pestañas */}
//         <View style={tw`flex-row mb-4 border-b border-gray-200`}>
//           <TouchableOpacity
//             style={[
//               tw`pb-2 px-4 border-b-2`,
//               activeTab === 'active' ? tw`border-blue-500` : tw`border-transparent`
//             ]}
//             onPress={() => setActiveTab('active')}
//           >
//             <Text style={[
//               tw`font-medium`,
//               activeTab === 'active' ? tw`text-blue-600` : tw`text-gray-500`
//             ]}>
//               Activos ({activeProducts.length})
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               tw`pb-2 px-4 border-b-2`,
//               activeTab === 'historical' ? tw`border-blue-500` : tw`border-transparent`
//             ]}
//             onPress={() => setActiveTab('historical')}
//           >
//             <Text style={[
//               tw`font-medium`,
//               activeTab === 'historical' ? tw`text-blue-600` : tw`text-gray-500`
//             ]}>
//               Histórico ({historicalProducts.length})
//             </Text>
//           </TouchableOpacity>
//         </View>
        
//         {renderContent()}
//       </View>
//     </MainLayout>
//   );
// };

// export default MetricasScreen;