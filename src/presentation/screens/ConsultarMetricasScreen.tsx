// src/presentation/screens/ConsultarMetricasScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';
import {
  Thermometer,
  Droplet,
  Sun,
  AlertTriangle,
  Box,
  MapPin,
  Calendar,
  StopCircle,
  Archive,
  Clock,
  Package,
  ChevronDown,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
} from 'react-native-feather';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
} from 'react-native-reanimated';
import MainLayout from '../layouts/MainLayout';
import api from '../../../api';
import { GlassCard } from '../components/animations';

const { width: screenWidth } = Dimensions.get('window');

// ============= INTERFACES =============
interface MonitoringData {
  id: number;
  id_producto_monitoreado: number;
  fecha: string;
  humedad: number;
  presion: number;
  temperatura: number;
  lux: number;
}

interface ProductoMonitoreado {
  id: number;
  id_producto: number;
  cantidad: number;
  localizacion: string;
  fecha_inicio_monitoreo: string;
  fecha_finalizacion_monitoreo?: string;
  nombre_producto: string;
  foto_producto: string;
  temperatura_min: number;
  temperatura_max: number;
  humedad_min: number;
  humedad_max: number;
  lux_min: number;
  lux_max: number;
  presion_min: number;
  presion_max: number;
}

type MetricType = 'temperatura' | 'humedad' | 'lux' | 'presion';

// ============= CONFIGURATION =============
const metricConfig: Record<
  MetricType,
  {
    bg: string;
    text: string;
    chart: string;
    gradient: string[];
    icon: any;
    unit: string;
    label: string;
  }
> = {
  temperatura: {
    bg: '#ffedd5',
    text: '#ea580c',
    chart: '#f97316',
    gradient: ['#fed7aa', '#fdba74'],
    icon: Thermometer,
    unit: '°C',
    label: 'Temperatura',
  },
  humedad: {
    bg: '#dbeafe',
    text: '#2563eb',
    chart: '#3b82f6',
    gradient: ['#bfdbfe', '#93c5fd'],
    icon: Droplet,
    unit: '%',
    label: 'Humedad',
  },
  lux: {
    bg: '#fef9c3',
    text: '#ca8a04',
    chart: '#eab308',
    gradient: ['#fde047', '#facc15'],
    icon: Sun,
    unit: 'lux',
    label: 'Luz',
  },
  presion: {
    bg: '#f3e8ff',
    text: '#2563eb',
    chart: '#3b82f6',
    gradient: ['#ddd6fe', '#c4b5fd'],
    icon: AlertTriangle,
    unit: 'hPa',
    label: 'Presión',
  },
};

// ============= MAIN COMPONENT =============
const ConsultarMetricasScreen = () => {
  const navigation = useNavigation();

  // State
  const [data, setData] = useState<MonitoringData[]>([]);
  const [activeProducts, setActiveProducts] = useState<ProductoMonitoreado[]>([]);
  const [historicalProducts, setHistoricalProducts] = useState<ProductoMonitoreado[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('temperatura');
  const [isStopping, setIsStopping] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const pulseAnim = useSharedValue(1);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await api.get('/productosmonitoreados/detalles');
      const productos = response.data;

      const active = productos.filter((p: ProductoMonitoreado) => !p.fecha_finalizacion_monitoreo);
      const historical = productos.filter((p: ProductoMonitoreado) => p.fecha_finalizacion_monitoreo);

      setActiveProducts(active);
      setHistoricalProducts(historical);

      if (active.length > 0 && !selectedProduct) {
        setSelectedProduct(active[0].id);
      }
    } catch (err) {
      setError('Error al cargar productos monitoreados');
      console.error(err);
    }
  };

  // Fetch monitoring data
  const fetchData = async () => {
    if (!selectedProduct) return;

    try {
      const response = await api.get(`/datosmonitoreo/${selectedProduct}`);
      const sortedData = response.data.sort(
        (a: MonitoringData, b: MonitoringData) =>
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
      setData(sortedData.slice(-30));
      setError(null);
    } catch (err) {
      setError('Error al obtener datos de monitoreo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle stop monitoring
  const handleStopMonitoring = async () => {
    if (!selectedProduct) return;

    Alert.alert(
      'Detener Monitoreo',
      '¿Estás seguro de que deseas detener el monitoreo de este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Detener',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsStopping(true);
              await api.patch(`/productosmonitoreados/${selectedProduct}/detener`);
              await fetchProducts();
              setSelectedProduct(null);
              Alert.alert('Éxito', 'Monitoreo detenido correctamente');
            } catch (err) {
              setError('Error al detener el monitoreo');
              Alert.alert('Error', 'No se pudo detener el monitoreo');
            } finally {
              setIsStopping(false);
            }
          },
        },
      ]
    );
  };

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    if (selectedProduct) await fetchData();
    setRefreshing(false);
  }, [selectedProduct]);

  // Effects
  useEffect(() => {
    fetchProducts();

    // Pulse animation for live indicator
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedProduct]);

  // ============= METRIC CARD COMPONENT (COMPACT) =============
  const MetricCard = ({ metric }: { metric: MetricType }) => {
    const config = metricConfig[metric];
    const Icon = config.icon;
    const currentData = data.length > 0 ? data[data.length - 1] : null;
    const currentProduct = activeProducts.find((p) => p.id === selectedProduct);
    const currentValue = currentData?.[metric] || 0;
    const min = currentProduct?.[`${metric}_min`] || 0;
    const max = currentProduct?.[`${metric}_max`] || 0;
    const isOutOfRange = currentValue < min || currentValue > max;

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 10 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 10 });
    };

    const progress = Math.min(Math.max(((currentValue - min) / (max - min)) * 100, 0), 100);

    return (
      <Animated.View
        entering={FadeInUp.delay(
          metric === 'temperatura' ? 0 : metric === 'humedad' ? 100 : metric === 'lux' ? 200 : 300
        ).springify()}
        style={tw`w-[48%] mb-3`}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => setSelectedMetric(metric)}
          activeOpacity={0.9}
        >
          <Animated.View style={animatedStyle}>
            <View
              style={[
                tw`rounded-2xl shadow-lg overflow-hidden`,
                selectedMetric === metric && tw`ring-2 ring-blue-500`,
                isOutOfRange && tw`ring-2 ring-red-500`,
              ]}
            >
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`p-4`}
              >
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={[tw`p-2 rounded-xl bg-white/30 shadow-sm`]}>
                      <Icon width={18} height={18} stroke={config.text} strokeWidth={2.5} />
                    </View>
                    <Text style={tw`ml-2 font-bold text-gray-900 text-base`}>
                      {config.label}
                    </Text>
                  </View>
                  {isOutOfRange && (
                    <View style={tw`bg-red-500 px-2.5 py-1 rounded-full shadow-md`}>
                      <Text style={tw`text-white text-xs font-bold`}>!</Text>
                    </View>
                  )}
                </View>

                <View style={tw`flex-row items-baseline mb-2`}>
                  <Text style={tw`text-3xl font-extrabold text-gray-900`}>
                    {currentValue?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={tw`text-gray-700 ml-1.5 text-base font-semibold`}>{config.unit}</Text>
                </View>

                <View style={tw`w-full bg-white/50 rounded-full h-2 mb-2`}>
                  <View
                    style={[
                      tw`h-2 rounded-full shadow-sm`,
                      { width: `${progress}%`, backgroundColor: config.chart },
                    ]}
                  />
                </View>

                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-[10px] text-gray-600 font-medium`}>Mín: {min}</Text>
                  <Text style={tw`text-[10px] text-gray-600 font-medium`}>Máx: {max}</Text>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ============= PRODUCT INFO CARD =============
  const ProductInfoCard = () => {
    const product = activeProducts.find((p) => p.id === selectedProduct);
    if (!product) return null;

    return (
      <Animated.View entering={FadeInDown.springify()}>
        <GlassCard style={tw`p-5 mb-5`}>
          <View style={tw`flex-row mb-4`}>
            <View
              style={[
                tw`w-24 h-24 rounded-2xl mr-4 shadow-lg`,
                { backgroundColor: '#f3f4f6' },
              ]}
            >
              <Image
                source={{ uri: product.foto_producto }}
                style={tw`w-full h-full rounded-2xl`}
                resizeMode="cover"
              />
            </View>

            <View style={tw`flex-1`}>
              <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>
                {product.nombre_producto}
              </Text>

              <View style={tw`flex-row items-center mb-1.5`}>
                <View style={tw`bg-blue-100 p-1.5 rounded-lg mr-2`}>
                  <Package width={16} height={16} stroke="#3b82f6" strokeWidth={2} />
                </View>
                <Text style={tw`text-sm text-gray-700 font-medium`}>
                  {product.cantidad} unidades
                </Text>
              </View>

              <View style={tw`flex-row items-center mb-1.5`}>
                <View style={tw`bg-green-100 p-1.5 rounded-lg mr-2`}>
                  <MapPin width={16} height={16} stroke="#10b981" strokeWidth={2} />
                </View>
                <Text style={tw`text-sm text-gray-700 font-medium`}>
                  {product.localizacion}
                </Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-blue-100 p-1.5 rounded-lg mr-2`}>
                  <Calendar width={16} height={16} stroke="#3b82f6" strokeWidth={2} />
                </View>
                <Text style={tw`text-sm text-gray-700 font-medium`}>
                  {format(new Date(product.fecha_inicio_monitoreo), 'd MMM yyyy', { locale: es })}
                </Text>
              </View>
            </View>
          </View>

          <View style={tw`border-t border-gray-200 pt-4`}>
            <Text style={tw`font-bold text-gray-800 mb-3`}>Especificaciones:</Text>
            <SpecRow
              label="Temperatura"
              value={`${product.temperatura_min}°C - ${product.temperatura_max}°C`}
              color="#f97316"
            />
            <SpecRow
              label="Humedad"
              value={`${product.humedad_min}% - ${product.humedad_max}%`}
              color="#3b82f6"
            />
            <SpecRow
              label="Luz"
              value={`${product.lux_min} - ${product.lux_max} lux`}
              color="#eab308"
            />
            <SpecRow
              label="Presión"
              value={`${product.presion_min} - ${product.presion_max} hPa`}
              color="#3b82f6"
            />
          </View>

          <TouchableOpacity
            style={tw`mt-4 bg-gradient-to-r from-blue-100 to-blue-200 p-3.5 rounded-xl flex-row items-center justify-center shadow-lg border-2 border-blue-300`}
            onPress={() => {
              // @ts-ignore
              navigation.navigate('HistoricoMonitoreo', { productoId: product.id });
            }}
          >
            <Clock width={18} height={18} stroke="#1e40af" strokeWidth={2} />
            <Text style={tw`text-blue-900 font-bold ml-2 text-base`}>Ver Registro Completo</Text>
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    );
  };

  // ============= SPEC ROW COMPONENT =============
  const SpecRow = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: string;
    color: string;
  }) => (
    <View style={tw`flex-row justify-between items-center mb-2`}>
      <Text style={tw`text-sm text-gray-600 font-medium`}>{label}:</Text>
      <View
        style={[tw`px-3 py-1 rounded-full`, { backgroundColor: `${color}15` }]}
      >
        <Text style={[tw`text-sm font-bold`, { color }]}>{value}</Text>
      </View>
    </View>
  );

  // ============= HISTORICAL PRODUCT ITEM =============
  const HistoricalProductItem = ({
    product,
    index,
  }: {
    product: ProductoMonitoreado;
    index: number;
  }) => {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100).springify()}
      >
        <TouchableOpacity
          style={tw`bg-white rounded-2xl p-4 mb-3 shadow-md border border-gray-100`}
          onPress={() => {
            // @ts-ignore
            navigation.navigate('HistoricoMonitoreo', { productoId: product.id });
          }}
        >
          <View style={tw`flex-row`}>
            <View style={tw`w-20 h-20 rounded-xl overflow-hidden mr-4 shadow-sm`}>
              <Image
                source={{ uri: product.foto_producto }}
                style={tw`w-full h-full`}
                resizeMode="cover"
              />
            </View>

            <View style={tw`flex-1`}>
              <View style={tw`flex-row justify-between items-start mb-2`}>
                <Text style={tw`font-bold text-gray-800 flex-1 mr-2`}>
                  {product.nombre_producto}
                </Text>
                <View style={tw`bg-gray-100 px-2.5 py-1 rounded-full`}>
                  <Text style={tw`text-gray-600 text-xs font-bold`}>Finalizado</Text>
                </View>
              </View>

              <View style={tw`flex-row items-center mb-1`}>
                <MapPin width={14} height={14} stroke="#10b981" strokeWidth={2} />
                <Text style={tw`text-xs text-gray-600 ml-1.5`}>
                  {product.localizacion}
                </Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <Calendar width={14} height={14} stroke="#3b82f6" strokeWidth={2} />
                <Text style={tw`text-xs text-gray-600 ml-1.5`}>
                  {format(new Date(product.fecha_inicio_monitoreo), 'dd MMM yyyy', { locale: es })} -{' '}
                  {product.fecha_finalizacion_monitoreo
                    ? format(new Date(product.fecha_finalizacion_monitoreo), 'dd MMM yyyy', {
                        locale: es,
                      })
                    : 'Presente'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={tw`mt-3 bg-gray-50 p-2.5 rounded-lg flex-row items-center justify-center`}
            onPress={() => {
              // @ts-ignore
              navigation.navigate('HistoricoMonitoreo', { productoId: product.id });
            }}
          >
            <Clock width={16} height={16} stroke="#6b7280" strokeWidth={2} />
            <Text style={tw`text-gray-700 font-semibold ml-2`}>Ver Detalles</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ============= PRODUCT SELECTOR MODAL =============
  const ProductSelectorModal = () => {
    if (!showProductSelector) return null;

    const modalAnim = useSharedValue(0);

    useEffect(() => {
      modalAnim.value = withSpring(1, { damping: 15 });
    }, []);

    const modalStyle = useAnimatedStyle(() => ({
      opacity: modalAnim.value,
      transform: [
        {
          translateY: (1 - modalAnim.value) * 100,
        },
      ],
    }));

    return (
      <View style={tw`absolute top-0 left-0 right-0 bottom-0 bg-black/50 z-50`}>
        <View
          style={tw`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70%] shadow-2xl`}
        >
          <Animated.View style={[modalStyle, tw`p-5 border-b border-gray-100`]}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-xl font-bold text-gray-900`}>Seleccionar Producto</Text>
              <TouchableOpacity onPress={() => setShowProductSelector(false)}>
                <View style={tw`bg-gray-100 p-2 rounded-full`}>
                  <Text style={tw`text-gray-600 font-bold`}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <ScrollView style={tw`p-4`}>
            {activeProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  tw`flex-row items-center p-4 mb-3 rounded-2xl border-2 shadow-sm`,
                  selectedProduct === product.id
                    ? tw`bg-blue-50 border-blue-500`
                    : tw`bg-white border-gray-100`,
                ]}
                onPress={() => {
                  setSelectedProduct(product.id);
                  setShowProductSelector(false);
                }}
              >
                <View
                  style={[
                    tw`w-16 h-16 rounded-xl overflow-hidden mr-4 shadow-sm`,
                    selectedProduct === product.id && tw`ring-2 ring-blue-500`,
                  ]}
                >
                  <Image
                    source={{ uri: product.foto_producto }}
                    style={tw`w-full h-full`}
                    resizeMode="cover"
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-bold text-gray-900 mb-1`}>
                    {product.nombre_producto}
                  </Text>
                  <Text style={tw`text-sm text-gray-500`}>{product.localizacion}</Text>
                </View>
                {selectedProduct === product.id && (
                  <CheckCircle width={24} height={24} stroke="#3b82f6" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            ))}

            {activeProducts.length === 0 && (
              <View style={tw`py-12 items-center`}>
                <Package width={60} height={60} stroke="#d1d5db" strokeWidth={1.5} />
                <Text style={tw`text-gray-400 mt-4 text-center`}>
                  No hay productos en monitoreo
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  // ============= LIVE INDICATOR =============
  const LiveIndicator = () => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: pulseAnim.value }],
    }));

    return (
      <Animated.View
        style={[
          animatedStyle,
          tw`bg-green-500 w-2.5 h-2.5 rounded-full mr-2`,
        ]}
      />
    );
  };

  // ============= CHART CONFIG =============
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: metricConfig[selectedMetric].chart,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5, 5',
      stroke: '#f3f4f6',
    },
  };

  // ============= MAIN RENDER =============
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <MainLayout title="">
        <ProductSelectorModal />

        {/* Hero Section with Animated Gradient Background */}
        <Animated.View entering={FadeInDown.springify()} style={tw`overflow-hidden`}>
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`px-5 pt-8 pb-6`}
          >
            <Animated.View
              entering={FadeInUp.delay(100).springify()}
              style={tw`mb-5`}
            >
              <Text style={tw`text-white text-3xl font-bold mb-2`}>
                Monitor Ambiental
              </Text>
              <Text style={tw`text-white/80 text-base`}>
                Monitoreo inteligente en tiempo real
              </Text>
            </Animated.View>

            {/* Animated Tab Switcher */}
            <View style={tw`bg-white/20 backdrop-blur-sm rounded-2xl p-1.5`}>
              <View style={tw`flex-row`}>
                <TouchableOpacity
                  onPress={() => setTabValue(0)}
                  style={tw.style(
                    `flex-1 py-3 rounded-xl flex-row items-center justify-center`,
                    tabValue === 0 ? `bg-white shadow-lg` : ``
                  )}
                  activeOpacity={0.9}
                >
                  <Animated.View
                    entering={ZoomIn.springify()}
                    style={tw`flex-row items-center`}
                  >
                    <View style={tw.style(
                      `p-1.5 rounded-lg`,
                      tabValue === 0 ? `bg-blue-500` : `bg-transparent`
                    )}>
                      <Box
                        width={18}
                        height={18}
                        stroke={tabValue === 0 ? '#ffffff' : '#ffffff80'}
                        strokeWidth={2.5}
                      />
                    </View>
                    <Text
                      style={tw.style(
                        `ml-2 font-bold text-base`,
                        tabValue === 0 ? `text-blue-900 font-semibold` : `text-blue-900 font-semibold`
                      )}
                    >
                      Activos
                    </Text>
                    <View style={tw`ml-2 bg-white px-2.5 py-1 rounded-full shadow-sm`}>
                      <Text style={tw`text-blue-900 text-xs font-bold`}>
                        {activeProducts.length}
                      </Text>
                    </View>
                    {tabValue === 0 && <LiveIndicator />}
                  </Animated.View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTabValue(1)}
                  style={tw.style(
                    `flex-1 py-3 rounded-xl flex-row items-center justify-center`,
                    tabValue === 1 ? `bg-white shadow-lg` : ``
                  )}
                  activeOpacity={0.9}
                >
                  <Animated.View
                    entering={ZoomIn.springify()}
                    style={tw`flex-row items-center`}
                  >
                    <View style={tw.style(
                      `p-1.5 rounded-lg`,
                      tabValue === 1 ? `bg-blue-500` : `bg-transparent`
                    )}>
                      <Archive
                        width={18}
                        height={18}
                        stroke={tabValue === 1 ? '#ffffff' : '#ffffff80'}
                        strokeWidth={2.5}
                      />
                    </View>
                    <Text
                      style={tw.style(
                        `ml-2 font-bold text-base`,
                        tabValue === 1 ? `text-blue-900 font-semibold` : `text-blue-900 font-semibold`
                      )}
                    >
                      Históricos
                    </Text>
                    <View style={tw`ml-2 bg-white px-2.5 py-1 rounded-full shadow-sm`}>
                      <Text style={tw`text-blue-900 text-xs font-bold`}>
                        {historicalProducts.length}
                      </Text>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Stats */}
            <Animated.View
              entering={FadeInUp.delay(200).springify()}
              style={tw`flex-row gap-3 mt-4`}
            >
              <View style={tw`flex-1 bg-blue-100 backdrop-blur-sm rounded-xl p-3`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-white p-2 rounded-lg`}>
                    <Activity width={16} height={16} stroke="#1e40af" strokeWidth={2.5} />
                  </View>
                  <View style={tw`ml-2`}>
                    <Text style={tw`text-blue-800 text-xs font-semibold`}>En Monitoreo</Text>
                    <Text style={tw`text-blue-900 text-xl font-bold`}>{activeProducts.length}</Text>
                  </View>
                </View>
              </View>

              <View style={tw`flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-3`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-white/30 p-2 rounded-lg`}>
                    <AlertTriangle width={16} height={16} stroke="#ffffff" strokeWidth={2.5} />
                  </View>
                  <View style={tw`ml-2`}>
                    <Text style={tw`text-white/70 text-xs`}>Alertas</Text>
                    <Text style={tw`text-white text-xl font-bold`}>0</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={tw`flex-1 bg-gray-50`}
          contentContainerStyle={tw`p-4`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#667eea']}
              tintColor="#667eea"
            />
          }
        >
          {tabValue === 0 ? (
            <Animated.View entering={FadeIn.springify()}>
              {/* Premium Product Selector */}
              <Animated.View entering={FadeInUp.delay(100).springify()}>
                <TouchableOpacity
                  onPress={() => setShowProductSelector(true)}
                  activeOpacity={0.95}
                >
                  <LinearGradient
                    colors={
                      selectedProduct
                        ? ['#667eea', '#764ba2']
                        : ['#f3f4f6', '#e5e7eb']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`rounded-3xl p-5 shadow-xl border border-white/20`}
                  >
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View
                          style={tw.style(
                            `p-3 rounded-2xl`,
                            selectedProduct ? `bg-white/20` : `bg-white`
                          )}
                        >
                          <Box
                            width={26}
                            height={26}
                            stroke={selectedProduct ? '#ffffff' : '#6b7280'}
                            strokeWidth={2}
                          />
                        </View>
                        <View style={tw`ml-4 flex-1`}>
                          <Text
                            style={tw.style(
                              `font-bold text-lg`,
                              selectedProduct ? `text-white` : `text-gray-800`
                            )}
                          >
                            {selectedProduct
                              ? activeProducts.find((p) => p.id === selectedProduct)?.nombre_producto
                              : 'Seleccionar producto'}
                          </Text>
                          <Text
                            style={tw.style(
                              `text-sm mt-0.5`,
                              selectedProduct ? `text-white/70` : `text-gray-500`
                            )}
                          >
                            {selectedProduct
                              ? activeProducts.find((p) => p.id === selectedProduct)?.localizacion
                              : 'Elige un producto para monitorear'}
                          </Text>
                        </View>
                      </View>
                      <Animated.View
                        sharedTransitionTag="chevron"
                        style={tw.style(
                          `p-2.5 rounded-xl`,
                          selectedProduct ? `bg-white/20` : `bg-white/50`
                        )}
                      >
                        <ChevronDown
                          width={24}
                          height={24}
                          stroke={selectedProduct ? '#ffffff' : '#6b7280'}
                          strokeWidth={2.5}
                        />
                      </Animated.View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Premium Action Buttons */}
              <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`flex-row gap-3 mb-5`}>
                <TouchableOpacity
                  onPress={handleStopMonitoring}
                  disabled={!selectedProduct || isStopping}
                  style={tw`flex-1`}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      !selectedProduct || isStopping
                        ? ['#d1d5db', '#9ca3af']
                        : ['#ff6b6b', '#ee5a6f']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`rounded-2xl p-4 shadow-lg flex-row items-center justify-center`}
                  >
                    <StopCircle width={22} height={22} stroke="#ffffff" strokeWidth={2} />
                    <Text style={tw`text-white font-bold ml-2 text-base`}>
                      {isStopping ? 'Deteniendo...' : 'Detener'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('HistoricoMonitoreo', { productoId: selectedProduct });
                  }}
                  disabled={!selectedProduct}
                  style={tw`flex-1`}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      !selectedProduct
                        ? ['#d1d5db', '#9ca3af']
                        : ['#667eea', '#764ba2']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`rounded-2xl p-4 shadow-lg flex-row items-center justify-center`}
                  >
                    <Clock width={22} height={22} stroke="#ffffff" strokeWidth={2} />
                    <Text style={tw`text-white font-bold ml-2 text-base`}>Histórico</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {loading && !selectedProduct ? (
                <View style={tw`items-center justify-center py-16`}>
                  <Animated.View entering={ZoomIn.springify()}>
                    <View
                      style={tw`bg-gradient-to-br from-blue-100 to-blue-100 p-6 rounded-3xl mb-4`}
                    >
                      <ActivityIndicator size="large" color="#667eea" />
                    </View>
                  </Animated.View>
                  <Text style={tw`text-gray-600 mt-4 font-semibold text-lg`}>Cargando productos...</Text>
                </View>
              ) : !selectedProduct ? (
                <View style={tw`items-center justify-center py-20 px-6`}>
                  <Animated.View entering={ZoomIn.springify()}>
                    <LinearGradient
                      colors={['#f3f4f6', '#e5e7eb']}
                      style={tw`p-8 rounded-3xl mb-6`}
                    >
                      <Package width={100} height={100} stroke="#9ca3af" strokeWidth={1.5} />
                    </LinearGradient>
                  </Animated.View>
                  <Text style={tw`text-gray-800 mt-4 text-center text-xl font-bold mb-2`}>
                    {activeProducts.length === 0
                      ? 'Sin productos en monitoreo'
                      : 'Selecciona un producto'}
                  </Text>
                  <Text style={tw`text-gray-500 text-center text-base`}>
                    {activeProducts.length === 0
                      ? 'Agrega productos para comenzar el monitoreo ambiental'
                      : 'Elige un producto de la lista para ver sus métricas en tiempo real'}
                  </Text>
                </View>
              ) : (
                <>
                  {/* Product Info Card */}
                  <ProductInfoCard />

                  {/* Metrics Cards */}
                  <View style={tw`mb-4`}>
                    <Animated.Text
                      entering={FadeInDown.springify()}
                      style={tw`text-base font-bold mb-3 text-gray-900`}
                    >
                      Métricas en tiempo real
                    </Animated.Text>
                    <View style={tw`flex-row flex-wrap justify-between`}>
                      <MetricCard metric="temperatura" />
                      <MetricCard metric="humedad" />
                      <MetricCard metric="lux" />
                      <MetricCard metric="presion" />
                    </View>
                  </View>

                  {/* Chart */}
                  {data.length > 0 ? (
                    <Animated.View entering={FadeInUp.springify()}>
                      <GlassCard style={tw`p-5 mb-5`}>
                        <View style={tw`flex-row items-center justify-between mb-4`}>
                          <Text style={tw`text-lg font-bold text-gray-900`}>
                            Evolución de {metricConfig[selectedMetric].label}
                          </Text>
                          <View
                            style={[
                              tw`px-3 py-1 rounded-full`,
                              { backgroundColor: metricConfig[selectedMetric].bg },
                            ]}
                          >
                            <Text
                              style={[
                                tw`text-sm font-bold`,
                                { color: metricConfig[selectedMetric].text },
                              ]}
                            >
                              {selectedMetric.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <LineChart
                          data={{
                            labels: data
                              .map((d) =>
                                format(new Date(d.fecha), 'HH:mm', { locale: es })
                              )
                              .filter((_, i) => i % Math.ceil(data.length / 6) === 0),
                            datasets: [
                              {
                                data: data.map((d) => d[selectedMetric]),
                                color: () => metricConfig[selectedMetric].chart,
                                strokeWidth: 3,
                              },
                            ],
                          }}
                          width={screenWidth - 60}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={{
                            marginVertical: 8,
                            borderRadius: 16,
                          }}
                        />

                        <View style={tw`flex-row items-center justify-center mt-3`}>
                          <LiveIndicator />
                          <Text style={tw`text-xs text-gray-500 font-medium`}>
                            Última actualización:{' '}
                            {format(new Date(), 'd MMM yyyy HH:mm:ss', { locale: es })}
                          </Text>
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ) : (
                    <GlassCard style={tw`p-8 items-center justify-center`}>
                      <ActivityIndicator size="large" color="#3b82f6" />
                      <Text style={tw`text-gray-600 mt-4 font-medium`}>
                        Cargando datos...
                      </Text>
                    </GlassCard>
                  )}
                </>
              )}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.springify()}>
              {/* Historical Header */}
              <Animated.View entering={FadeInUp.springify()} style={tw`mb-6`}>
                <LinearGradient
                  colors={['#667eea15', '#764ba215']}
                  style={tw`rounded-2xl p-5 border border-blue-100`}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl`}>
                        <Archive width={24} height={24} stroke="#ffffff" strokeWidth={2} />
                      </View>
                      <View style={tw`ml-4`}>
                        <Text style={tw`text-xl font-bold text-gray-900`}>
                          Monitoreos Históricos
                        </Text>
                        <Text style={tw`text-gray-500 text-sm mt-0.5`}>
                          {historicalProducts.length} registro{historicalProducts.length !== 1 ? 's' : ''} finalizado{historicalProducts.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {historicalProducts.length > 0 ? (
                historicalProducts.map((product, index) => (
                  <HistoricalProductItem key={product.id} product={product} index={index} />
                ))
              ) : (
                <View style={tw`flex-col items-center justify-center py-20 px-6`}>
                  <LinearGradient
                    colors={['#f3f4f6', '#e5e7eb']}
                    style={tw`p-8 rounded-3xl mb-6`}
                  >
                    <Archive width={100} height={100} stroke="#9ca3af" strokeWidth={1.5} />
                  </LinearGradient>
                  <Text style={tw`text-gray-800 mt-4 text-center text-xl font-bold mb-2`}>
                    Sin registros históricos
                  </Text>
                  <Text style={tw`text-gray-500 text-center text-base`}>
                    Los monitoreos finalizados aparecerán aquí
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </MainLayout>
    </>
  );
};

export default ConsultarMetricasScreen;
