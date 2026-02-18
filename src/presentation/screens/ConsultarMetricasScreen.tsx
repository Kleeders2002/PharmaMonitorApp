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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Activity,
  Filter,
  X,
} from 'react-native-feather';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
type DateRangeType = '24h' | '7d' | '30d' | 'custom';

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
    bg: '#dbeafe',
    text: '#2563eb',
    chart: '#3b82f6',
    gradient: ['#bfdbfe', '#93c5fd'],
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
  const [allData, setAllData] = useState<MonitoringData[]>([]);
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

  // Date filter state
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('24h');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)));
  const [endHour, setEndHour] = useState<Date>(new Date(new Date().setHours(23, 59, 59, 999)));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartHourPicker, setShowStartHourPicker] = useState(false);
  const [showEndHourPicker, setShowEndHourPicker] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);

  // Animation values
  const pulseAnim = useSharedValue(1);

  // Fetch products
  const fetchProducts = useCallback(async () => {
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
  }, [selectedProduct]);

  // Filter data by date range and hour range
  const filterDataByDateRange = useCallback((allData: MonitoringData[], start: Date, end: Date, startH: Date, endH: Date) => {
    const startTimestamp = startOfDay(start).getTime() + (startH.getHours() * 3600000) + (startH.getMinutes() * 60000);
    const endTimestamp = endOfDay(end).getTime() - ((23 - endH.getHours()) * 3600000) - ((59 - endH.getMinutes()) * 60000);

    const filtered = allData.filter((d) => {
      const dataTimestamp = new Date(d.fecha).getTime();
      return dataTimestamp >= startTimestamp && dataTimestamp <= endTimestamp;
    });

    setData(filtered);
  }, []);

  // Fetch all monitoring data
  const fetchAllData = useCallback(async () => {
    if (!selectedProduct) return;

    try {
      const response = await api.get(`/datosmonitoreo/${selectedProduct}`);
      const sortedData = response.data.sort(
        (a: MonitoringData, b: MonitoringData) =>
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
      setAllData(sortedData);
      filterDataByDateRange(sortedData, startDate, endDate, startHour, endHour);
      setError(null);
    } catch (err) {
      setError('Error al obtener datos de monitoreo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, startDate, endDate, startHour, endHour, filterDataByDateRange]);

  // Handle date range type change
  const handleDateRangeChange = (range: DateRangeType) => {
    setDateRangeType(range);
    const now = new Date();

    switch (range) {
      case '24h':
        setStartDate(subDays(now, 1));
        setEndDate(now);
        break;
      case '7d':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case '30d':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case 'custom':
        // Keep current dates
        break;
    }
  };

  // Apply date and hour filter
  useEffect(() => {
    if (allData.length > 0) {
      filterDataByDateRange(allData, startDate, endDate, startHour, endHour);
    }
  }, [startDate, endDate, startHour, endHour, allData, filterDataByDateRange]);

  // Handle stop monitoring
  const handleStopMonitoring = async () => {
    console.log('🔘 Botón DETENER presionado');
    console.log('📦 selectedProduct:', selectedProduct);
    console.log('📦 isStopping antes:', isStopping);

    if (!selectedProduct) {
      console.log('❌ ERROR: No hay producto seleccionado');
      Alert.alert('Error', 'No hay producto seleccionado');
      return;
    }

    console.log('✅ Producto seleccionado válido, iniciando proceso...');

    // Verificar si hay token antes de hacer la petición
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      console.log('❌ ERROR: No hay token de acceso');
      Alert.alert(
        'Error de Autenticación',
        'No hay una sesión activa. Por favor, inicia sesión nuevamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        ]
      );
      return;
    }

    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

    try {
      setIsStopping(true);
      console.log('⏳ isStopping establecido en true');
      console.log('📡 Enviando petición PATCH a:', `/productosmonitoreados/${selectedProduct}/detener`);

      const response = await api.patch(`/productosmonitoreados/${selectedProduct}/detener`);
      console.log('✅ Respuesta recibida:', response.status);
      console.log('✅ Datos:', response.data);

      console.log('🔄 Recargando productos...');
      await fetchProducts();

      console.log('🧹 Limpiando estado...');
      setSelectedProduct(null);
      setData([]);
      setAllData([]);

      // Esperar un momento para que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🔄 Buscando siguiente producto activo...');
      const productosResponse = await api.get('/productosmonitoreados/detalles');
      const productos = productosResponse.data;
      const active = productos.filter((p: ProductoMonitoreado) => !p.fecha_finalizacion_monitoreo);

      console.log('📦 Productos activos restantes:', active.length);

      if (active.length > 0) {
        console.log('✅ Seleccionando siguiente producto:', active[0].id);
        setSelectedProduct(active[0].id);
      }

      Alert.alert('Éxito', 'Monitoreo detenido correctamente');
    } catch (err: any) {
      console.error('❌ ERROR al detener monitoreo:', err);
      console.error('❌ Mensaje:', err.message);
      console.error('❌ Response:', err.response);
      console.error('❌ Status:', err.response?.status);
      console.error('❌ Data:', err.response?.data);

      setError('Error al detener el monitoreo');

      // Manejo específico para error 401
      if (err.response?.status === 401) {
        Alert.alert(
          'Error de Autenticación',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
        return;
      }

      Alert.alert(
        'Error',
        `No se pudo detener el monitoreo.\n\nStatus: ${err.response?.status || 'Sin respuesta'}\nMensaje: ${err.response?.data?.message || err.message || 'Error desconocido'}`
      );
    } finally {
      console.log('🔄 Finalizando, isStopping = false');
      setIsStopping(false);
    }
  };

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    if (selectedProduct) await fetchAllData();
    setRefreshing(false);
  }, [selectedProduct, fetchAllData, fetchProducts]);

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
  }, [fetchProducts]);

  useEffect(() => {
    if (selectedProduct) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedProduct, fetchAllData]);

  // Date picker handlers
  const onStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Hour picker handlers
  const onStartHourChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartHourPicker(false);
    }
    if (selectedTime) {
      setStartHour(selectedTime);
    }
  };

  const onEndHourChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndHourPicker(false);
    }
    if (selectedTime) {
      setEndHour(selectedTime);
    }
  };

  // ============= DATE RANGE BUTTON =============
  const DateRangeButton = () => {
    return (
      <TouchableOpacity
        onPress={() => setShowDateFilterModal(true)}
        style={tw`bg-white rounded-xl shadow-md border border-blue-100 p-3`}
      >
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`bg-blue-100 p-2 rounded-lg mr-2.5`}>
              <Filter width={18} height={18} stroke="#2563eb" strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-[10px] text-gray-500 font-semibold mb-0.5`}>Rango de fechas y horas</Text>
              <Text style={tw`text-xs font-bold text-gray-900`}>
                {format(startDate, 'd MMM', { locale: es })} {format(startHour, 'HH:mm', { locale: es })} - {format(endDate, 'd MMM yyyy', { locale: es })} {format(endHour, 'HH:mm', { locale: es })}
              </Text>
            </View>
          </View>
          <View style={tw`bg-blue-500 px-2.5 py-1 rounded-full`}>
            <Text style={tw`text-white text-[10px] font-bold`}>
              {data.length} datos
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ============= DATE FILTER MODAL =============
  const DateFilterModal = () => {
    if (!showDateFilterModal) return null;

    return (
      <View style={tw`absolute top-0 left-0 right-0 bottom-0 bg-black/50 z-50 flex-1 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl shadow-2xl`}>
          <View style={tw`p-5 border-b border-gray-100`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-xl font-bold text-gray-900`}>Filtrar por fechas y horas</Text>
              <TouchableOpacity onPress={() => setShowDateFilterModal(false)}>
                <View style={tw`bg-gray-100 p-2 rounded-full`}>
                  <X width={20} height={20} stroke="#6b7280" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={tw`p-5`}>
            {/* Quick range options */}
            <Text style={tw`text-sm font-bold text-gray-700 mb-3`}>Rango rápido</Text>
            <View style={tw`flex-row gap-2 mb-6`}>
              {(['24h', '7d', '30d'] as DateRangeType[]).map((range) => (
                <TouchableOpacity
                  key={range}
                  onPress={() => {
                    handleDateRangeChange(range);
                    setShowDateFilterModal(false);
                  }}
                  style={[
                    tw`flex-1 py-3 rounded-xl border-2`,
                    dateRangeType === range
                      ? tw`bg-blue-500 border-blue-500`
                      : tw`bg-white border-gray-200`,
                  ]}
                >
                  <Text
                    style={[
                      tw`text-center font-bold text-sm`,
                      dateRangeType === range ? tw`text-white` : tw`text-gray-700`,
                    ]}
                  >
                    {range === '24h' ? '24 horas' : range === '7d' ? '7 días' : '30 días'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom date range */}
            <Text style={tw`text-sm font-bold text-gray-700 mb-3`}>Rango personalizado</Text>

            <View style={tw`flex-row gap-3 mb-3`}>
              <TouchableOpacity
                onPress={() => {
                  setDateRangeType('custom');
                  setShowStartDatePicker(true);
                }}
                style={tw`flex-1 bg-gray-50 rounded-xl p-4 border-2 border-gray-200`}
              >
                <Text style={tw`text-xs text-gray-500 font-semibold mb-1`}>Desde (fecha)</Text>
                <Text style={tw`text-base font-bold text-gray-900`}>
                  {format(startDate, 'd MMM', { locale: es })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDateRangeType('custom');
                  setShowStartHourPicker(true);
                }}
                style={tw`flex-1 bg-blue-50 rounded-xl p-4 border-2 border-blue-200`}
              >
                <Text style={tw`text-xs text-blue-600 font-semibold mb-1`}>Desde (hora)</Text>
                <Text style={tw`text-base font-bold text-blue-900`}>
                  {format(startHour, 'HH:mm', { locale: es })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row gap-3 mb-4`}>
              <TouchableOpacity
                onPress={() => {
                  setDateRangeType('custom');
                  setShowEndDatePicker(true);
                }}
                style={tw`flex-1 bg-gray-50 rounded-xl p-4 border-2 border-gray-200`}
              >
                <Text style={tw`text-xs text-gray-500 font-semibold mb-1`}>Hasta (fecha)</Text>
                <Text style={tw`text-base font-bold text-gray-900`}>
                  {format(endDate, 'd MMM yyyy', { locale: es })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDateRangeType('custom');
                  setShowEndHourPicker(true);
                }}
                style={tw`flex-1 bg-blue-50 rounded-xl p-4 border-2 border-blue-200`}
              >
                <Text style={tw`text-xs text-blue-600 font-semibold mb-1`}>Hasta (hora)</Text>
                <Text style={tw`text-base font-bold text-blue-900`}>
                  {format(endHour, 'HH:mm', { locale: es })}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowDateFilterModal(false)}
              style={tw`bg-blue-500 rounded-xl p-4 shadow-lg`}
            >
              <Text style={tw`text-white text-center font-bold text-base`}>Aplicar filtro</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Date pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
              maximumDate={endDate}
              style={tw`flex-1`}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={onEndDateChange}
              minimumDate={startDate}
              maximumDate={new Date()}
              style={tw`flex-1`}
            />
          )}

          {/* Hour pickers */}
          {showStartHourPicker && (
            <DateTimePicker
              value={startHour}
              mode="time"
              display="default"
              onChange={onStartHourChange}
              style={tw`flex-1`}
            />
          )}

          {showEndHourPicker && (
            <DateTimePicker
              value={endHour}
              mode="time"
              display="default"
              onChange={onEndHourChange}
              style={tw`flex-1`}
            />
          )}
        </View>
      </View>
    );
  };

  // ============= METRIC CARD COMPONENT =============
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
        style={tw`w-[48%] mb-2`}
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
                tw`rounded-xl shadow-md overflow-hidden`,
                selectedMetric === metric && tw`ring-2 ring-blue-500`,
                isOutOfRange && tw`ring-2 ring-red-500`,
              ]}
            >
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`p-3`}
              >
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={[tw`p-1.5 rounded-lg bg-white/30 shadow-sm`]}>
                      <Icon width={16} height={16} stroke={config.text} strokeWidth={2.5} />
                    </View>
                    <Text style={tw`ml-1.5 font-bold text-gray-900 text-sm`}>
                      {config.label}
                    </Text>
                  </View>
                  {isOutOfRange && (
                    <View style={tw`bg-red-500 px-2 py-0.5 rounded-full shadow-md`}>
                      <Text style={tw`text-white text-[10px] font-bold`}>!</Text>
                    </View>
                  )}
                </View>

                <View style={tw`flex-row items-baseline mb-1.5`}>
                  <Text style={tw`text-2xl font-extrabold text-gray-900`}>
                    {currentValue?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={tw`text-gray-700 ml-1 text-sm font-semibold`}>{config.unit}</Text>
                </View>

                <View style={tw`w-full bg-white/50 rounded-full h-1.5 mb-1.5`}>
                  <View
                    style={[
                      tw`h-1.5 rounded-full shadow-sm`,
                      { width: `${progress}%`, backgroundColor: config.chart },
                    ]}
                  />
                </View>

                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-[9px] text-gray-600 font-medium`}>Mín: {min}</Text>
                  <Text style={tw`text-[9px] text-gray-600 font-medium`}>Máx: {max}</Text>
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
        <GlassCard style={tw`p-4 mb-4`}>
          <View style={tw`flex-row mb-3`}>
            <View
              style={[
                tw`w-20 h-20 rounded-xl mr-3 shadow-md`,
                { backgroundColor: '#f3f4f6' },
              ]}
            >
              <Image
                source={{ uri: product.foto_producto }}
                style={tw`w-full h-full rounded-xl`}
                resizeMode="cover"
              />
            </View>

            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>
                {product.nombre_producto}
              </Text>

              <View style={tw`flex-row items-center mb-1.5`}>
                <View style={tw`bg-blue-100 p-1 rounded-lg mr-2`}>
                  <Package width={14} height={14} stroke="#3b82f6" strokeWidth={2} />
                </View>
                <Text style={tw`text-xs text-gray-700 font-medium`}>
                  {product.cantidad} unidades
                </Text>
              </View>

              <View style={tw`flex-row items-center mb-1.5`}>
                <View style={tw`bg-green-100 p-1 rounded-lg mr-2`}>
                  <MapPin width={14} height={14} stroke="#10b981" strokeWidth={2} />
                </View>
                <Text style={tw`text-xs text-gray-700 font-medium`}>
                  {product.localizacion}
                </Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-blue-100 p-1 rounded-lg mr-2`}>
                  <Calendar width={14} height={14} stroke="#3b82f6" strokeWidth={2} />
                </View>
                <Text style={tw`text-xs text-gray-700 font-medium`}>
                  {format(new Date(product.fecha_inicio_monitoreo), 'd MMM yyyy', { locale: es })}
                </Text>
              </View>
            </View>
          </View>

          <View style={tw`border-t border-gray-200 pt-3`}>
            <Text style={tw`text-sm font-bold text-gray-800 mb-2`}>Especificaciones:</Text>
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
    <View style={tw`flex-row justify-between items-center mb-1.5`}>
      <Text style={tw`text-xs text-gray-600 font-medium`}>{label}:</Text>
      <View
        style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: `${color}15` }]}
      >
        <Text style={[tw`text-xs font-bold`, { color }]}>{value}</Text>
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
          style={tw`bg-blue-50 rounded-xl p-3 mb-2 shadow-sm border border-blue-100`}
          onPress={() => {
            console.log('🔘 Botón HISTÓRICO desde tarjeta presionado');
            console.log('📦 product.id:', product.id);
            navigation.navigate('HistoricoMonitoreo', { productoId: product.id });
          }}
        >
          <View style={tw`flex-row`}>
            <View style={tw`w-16 h-16 rounded-lg overflow-hidden mr-3 shadow-sm`}>
              <Image
                source={{ uri: product.foto_producto }}
                style={tw`w-full h-full`}
                resizeMode="cover"
              />
            </View>

            <View style={tw`flex-1`}>
              <View style={tw`flex-row justify-between items-start mb-1.5`}>
                <Text style={tw`font-bold text-gray-900 flex-1 mr-2 text-sm`}>
                  {product.nombre_producto}
                </Text>
                <View style={tw`bg-blue-200 px-2 py-0.5 rounded-full`}>
                  <Text style={tw`text-blue-900 text-[10px] font-bold`}>Finalizado</Text>
                </View>
              </View>

              <View style={tw`flex-row items-center mb-1`}>
                <MapPin width={12} height={12} stroke="#10b981" strokeWidth={2} />
                <Text style={tw`text-[11px] text-gray-600 ml-1.5`}>
                  {product.localizacion}
                </Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <Calendar width={12} height={12} stroke="#3b82f6" strokeWidth={2} />
                <Text style={tw`text-[11px] text-gray-600 ml-1.5`}>
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
            style={tw`mt-2 bg-gray-50 p-2 rounded-lg flex-row items-center justify-center`}
            onPress={() => {
              console.log('🔘 Botón HISTÓRICO "Ver Detalles" presionado');
              console.log('📦 product.id:', product.id);
              navigation.navigate('HistoricoMonitoreo', { productoId: product.id });
            }}
          >
            <Clock width={14} height={14} stroke="#6b7280" strokeWidth={2} />
            <Text style={tw`text-gray-700 font-semibold ml-1.5 text-xs`}>Ver Detalles</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ============= PRODUCT SELECTOR MODAL =============
  const ProductSelectorModal = () => {
    if (!showProductSelector) return null;

    return (
      <View style={tw`absolute top-0 left-0 right-0 bottom-0 bg-black/50 z-50`}>
        <View
          style={tw`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70%] shadow-2xl`}
        >
          <View style={tw`p-5 border-b border-blue-100`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-xl font-bold text-gray-900`}>Seleccionar Producto</Text>
              <TouchableOpacity onPress={() => setShowProductSelector(false)}>
                <View style={tw`bg-gray-100 p-2 rounded-full`}>
                  <Text style={tw`text-gray-600 font-bold`}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={tw`p-4`}>
            {activeProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  tw`flex-row items-center p-4 mb-3 rounded-2xl border-2 shadow-sm`,
                  selectedProduct === product.id
                    ? tw`bg-blue-50 border-blue-500`
                    : tw`bg-white border-blue-100`,
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
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1.5',
      stroke: metricConfig[selectedMetric].chart,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4, 4',
      stroke: '#e5e7eb',
      strokeWidth: '1',
    },
    fillShadowGradient: metricConfig[selectedMetric].chart,
    fillShadowGradientOpacity: 0.1,
  };

  // ============= MAIN RENDER =============
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <MainLayout title="">
        <ProductSelectorModal />
        <DateFilterModal />

        {/* Hero Section with Blue Gradient Background */}
        <Animated.View entering={FadeInDown.springify()} style={tw`overflow-hidden`}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`px-5 pt-6 pb-5`}
          >
            <Animated.View
              entering={FadeInUp.delay(100).springify()}
              style={tw`mb-4`}
            >
              <Text style={tw`text-white text-2xl font-bold mb-1`}>
                Monitor Ambiental
              </Text>
              <Text style={tw`text-white/80 text-sm`}>
                Monitoreo inteligente en tiempo real
              </Text>
            </Animated.View>

            {/* Animated Tab Switcher */}
            <View style={tw`bg-white/20 backdrop-blur-sm rounded-xl p-1`}>
              <View style={tw`flex-row`}>
                <TouchableOpacity
                  onPress={() => setTabValue(0)}
                  style={tw.style(
                    `flex-1 py-2.5 rounded-lg flex-row items-center justify-center`,
                    tabValue === 0 ? `bg-white shadow-md` : ``
                  )}
                  activeOpacity={0.9}
                >
                  <View style={tw`flex-row items-center`}>
                    <View style={tw.style(
                      `p-1 rounded-lg`,
                      tabValue === 0 ? `bg-blue-500` : `bg-transparent`
                    )}>
                      <Box
                        width={16}
                        height={16}
                        stroke={tabValue === 0 ? '#ffffff' : '#ffffff80'}
                        strokeWidth={2.5}
                      />
                    </View>
                    <Text
                      style={tw.style(
                        `ml-1.5 font-bold text-sm`,
                        tabValue === 0 ? `text-blue-900` : `text-white`
                      )}
                    >
                      Activos
                    </Text>
                    <View style={tw`ml-1.5 bg-white px-2 py-0.5 rounded-full shadow-sm`}>
                      <Text style={tw`text-blue-900 text-xs font-bold`}>
                        {activeProducts.length}
                      </Text>
                    </View>
                    {tabValue === 0 && <LiveIndicator />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTabValue(1)}
                  style={tw.style(
                    `flex-1 py-2.5 rounded-lg flex-row items-center justify-center`,
                    tabValue === 1 ? `bg-blue-100 shadow-md border border-blue-300` : `bg-transparent`
                  )}
                  activeOpacity={0.9}
                >
                  <View style={tw`flex-row items-center`}>
                    <View style={tw.style(
                      `p-1 rounded-lg`,
                      tabValue === 1 ? `bg-blue-500` : `bg-transparent`
                    )}>
                      <Archive
                        width={16}
                        height={16}
                        stroke={tabValue === 1 ? '#ffffff' : '#ffffff80'}
                        strokeWidth={2.5}
                      />
                    </View>
                    <Text
                      style={tw.style(
                        `ml-1.5 font-bold text-sm`,
                        tabValue === 1 ? `text-blue-900` : `text-white`
                      )}
                    >
                      Históricos
                    </Text>
                    <View style={tw`ml-1.5 bg-white px-2 py-0.5 rounded-full shadow-sm`}>
                      <Text style={tw`text-blue-900 text-xs font-bold`}>
                        {historicalProducts.length}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Stats */}
            <Animated.View
              entering={FadeInUp.delay(200).springify()}
              style={tw`flex-row gap-2 mt-3`}
            >
              <View style={tw`flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-2.5`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-blue-200/50 p-1.5 rounded-lg`}>
                    <Activity width={14} height={14} stroke="#ffffff" strokeWidth={2.5} />
                  </View>
                  <View style={tw`ml-2`}>
                    <Text style={tw`text-white/70 text-xs`}>En Monitoreo</Text>
                    <Text style={tw`text-white text-lg font-bold`}>{activeProducts.length}</Text>
                  </View>
                </View>
              </View>

              <View style={tw`flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-2.5`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-white/20 p-1.5 rounded-lg`}>
                    <AlertTriangle width={14} height={14} stroke="#ffffff" strokeWidth={2.5} />
                  </View>
                  <View style={tw`ml-2`}>
                    <Text style={tw`text-white/70 text-xs`}>Alertas</Text>
                    <Text style={tw`text-white text-lg font-bold`}>0</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={tw`flex-1 bg-gray-50`}
          contentContainerStyle={tw`p-3 pb-6`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
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
                        ? ['#3b82f6', '#2563eb']
                        : ['#f3f4f6', '#e5e7eb']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`rounded-2xl p-4 shadow-lg border border-white/20`}
                  >
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View
                          style={tw.style(
                            `p-2.5 rounded-xl`,
                            selectedProduct ? `bg-white/20` : `bg-white`
                          )}
                        >
                          <Box
                            width={22}
                            height={22}
                            stroke={selectedProduct ? '#ffffff' : '#6b7280'}
                            strokeWidth={2}
                          />
                        </View>
                        <View style={tw`ml-3 flex-1`}>
                          <Text
                            style={tw.style(
                              `font-bold text-base`,
                              selectedProduct ? `text-white` : `text-gray-800`
                            )}
                          >
                            {selectedProduct
                              ? activeProducts.find((p) => p.id === selectedProduct)?.nombre_producto
                              : 'Seleccionar producto'}
                          </Text>
                          <Text
                            style={tw.style(
                              `text-xs mt-0.5`,
                              selectedProduct ? `text-white/70` : `text-gray-500`
                            )}
                          >
                            {selectedProduct
                              ? activeProducts.find((p) => p.id === selectedProduct)?.localizacion
                              : 'Elige un producto para monitorear'}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={tw.style(
                          `p-2 rounded-lg`,
                          selectedProduct ? `bg-white/20` : `bg-white/50`
                        )}
                      >
                        <ChevronDown
                          width={20}
                          height={20}
                          stroke={selectedProduct ? '#ffffff' : '#6b7280'}
                          strokeWidth={2.5}
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Premium Action Buttons */}
              <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`flex-row gap-2 mt-3 mb-3`}>
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
                        : ['#ef4444', '#dc2626']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`rounded-xl p-3 shadow-md flex-row items-center justify-center`}
                  >
                    <StopCircle width={18} height={18} stroke="#ffffff" strokeWidth={2} />
                    <Text style={tw`text-white font-bold ml-1.5 text-sm`}>
                      {isStopping ? 'Deteniendo...' : 'Detener'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    console.log('🔘 Botón HISTÓRICO presionado');
                    console.log('📦 selectedProduct:', selectedProduct);
                    if (selectedProduct) {
                      console.log('✅ Navegando a HistoricoMonitoreo con productoId:', selectedProduct);
                      navigation.navigate('HistoricoMonitoreo', { productoId: selectedProduct });
                    } else {
                      console.log('❌ ERROR: No hay producto seleccionado');
                      Alert.alert('Error', 'Por favor selecciona un producto primero');
                    }
                  }}
                  disabled={!selectedProduct}
                  style={tw`flex-1`}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      !selectedProduct
                        ? ['#d1d5db', '#9ca3af']
                        : ['#3b82f6', '#2563eb']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`rounded-xl p-3 shadow-md flex-row items-center justify-center`}
                  >
                    <Clock width={18} height={18} stroke="#ffffff" strokeWidth={2} />
                    <Text style={tw`text-white font-bold ml-1.5 text-sm`}>Histórico</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {loading && !selectedProduct ? (
                <View style={tw`items-center justify-center py-16`}>
                  <Animated.View entering={ZoomIn.springify()}>
                    <View
                      style={tw`bg-gradient-to-br from-blue-100 to-blue-100 p-6 rounded-3xl mb-4`}
                    >
                      <ActivityIndicator size="large" color="#3b82f6" />
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

                  {/* Date Range Filter */}
                  <Animated.View entering={FadeInUp.delay(300).springify()} style={tw`mb-5`}>
                    <DateRangeButton />
                  </Animated.View>

                  {/* Metrics Cards */}
                  <View style={tw`mb-3`}>
                    <Animated.Text
                      entering={FadeInDown.springify()}
                      style={tw`text-sm font-bold mb-2 text-gray-900`}
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
                      <GlassCard style={tw`p-4 mb-3`}>
                        <View style={tw`flex-row items-center justify-between mb-3`}>
                          <Text style={tw`text-base font-bold text-gray-900`}>
                            Evolución de {metricConfig[selectedMetric].label}
                          </Text>
                          <View
                            style={[
                              tw`px-2.5 py-1 rounded-full`,
                              { backgroundColor: metricConfig[selectedMetric].bg },
                            ]}
                          >
                            <Text
                              style={[
                                tw`text-xs font-bold`,
                                { color: metricConfig[selectedMetric].text },
                              ]}
                            >
                              {selectedMetric.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <View style={tw`items-center`}>
                          <LineChart
                            data={{
                              labels: data
                                .map((d) =>
                                  format(new Date(d.fecha), 'HH:mm', { locale: es })
                                ),
                              datasets: [
                                {
                                  data: data.map((d) => d[selectedMetric]),
                                  color: () => metricConfig[selectedMetric].chart,
                                  strokeWidth: 2.5,
                                },
                              ],
                            }}
                            width={screenWidth - 62}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            withInnerLines={true}
                            withOuterLines={true}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                            withDots={true}
                            segments={5}
                            style={{
                              marginVertical: 6,
                              borderRadius: 16,
                            }}
                            formatYLabel={(yLabel) => parseFloat(yLabel).toFixed(1)}
                          />
                        </View>

                        <View style={tw`flex-row items-center justify-center mt-2`}>
                          <LiveIndicator />
                          <Text style={tw`text-xs text-gray-500 font-medium`}>
                            Última actualización:{' '}
                            {format(new Date(), 'd MMM yyyy HH:mm:ss', { locale: es })}
                          </Text>
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ) : (
                    <GlassCard style={tw`p-6 items-center justify-center mb-3`}>
                      <ActivityIndicator size="large" color="#3b82f6" />
                      <Text style={tw`text-gray-600 mt-3 font-medium text-sm`}>
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
              <Animated.View entering={FadeInUp.springify()} style={tw`mb-4`}>
                <LinearGradient
                  colors={['#dbeafe', '#bfdbfe']}
                  style={tw`rounded-xl p-4 border border-blue-100`}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl`}>
                        <Archive width={20} height={20} stroke="#ffffff" strokeWidth={2} />
                      </View>
                      <View style={tw`ml-3`}>
                        <Text style={tw`text-base font-bold text-gray-900`}>
                          Monitoreos Históricos
                        </Text>
                        <Text style={tw`text-gray-500 text-xs mt-0.5`}>
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
