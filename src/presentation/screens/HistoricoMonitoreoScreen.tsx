// src/presentation/screens/HistoricoMonitoreoScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';
import {
  Calendar,
  ChevronDown,
  Box,
  Thermometer,
  Sun,
  Activity,
  TrendingUp,
  ArrowLeft,
} from 'react-native-feather';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import MainLayout from '../layouts/MainLayout';
import { GlassCard } from '../components/animations';
import { useMonitoreo } from '../../context/MonitoreoContext';
import { RootStackParamList } from '../navigation/types';
import api from '../../../api';

type HistoricoMonitoreoRouteProp = RouteProp<RootStackParamList, 'HistoricoMonitoreo'>;
type HistoricoMonitoreoNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface RegistroHistorico {
  id: number;
  fecha: string;
  temperatura: number;
  humedad: number;
  lux: number;
  presion: number;
}

const HistoricoMonitoreoScreen = () => {
  const route = useRoute<HistoricoMonitoreoRouteProp>();
  const navigation = useNavigation<HistoricoMonitoreoNavigationProp>();

  const { productoId, productoNombre } = route.params || {};
  const { productosMonitoreados, fetchProductosMonitoreados } = useMonitoreo();

  const [selectedProducto, setSelectedProducto] = useState<number | undefined>(productoId);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historicoData, setHistoricoData] = useState<RegistroHistorico[]>([]);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);

  useEffect(() => {
    fetchProductosMonitoreados();
  }, []);

  useEffect(() => {
    if (selectedProducto) {
      fetchHistoricoData();
    }
  }, [selectedProducto, startDate, endDate]);

  const fetchHistoricoData = async () => {
    if (!selectedProducto) return;

    try {
      setLoading(true);
      const token = await localStorage.getItem('access_token');

      const response = await api.get(
        `/productosmonitoreados/${selectedProducto}/historico`,
        {
          params: {
            fecha_inicio: format(startDate, 'yyyy-MM-dd'),
            fecha_fin: format(endDate, 'yyyy-MM-dd'),
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHistoricoData(response.data.registros || []);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setHistoricoData([]);
    } finally {
      setLoading(false);
    }
  };

  const getProductoName = () => {
    if (productoNombre) return productoNombre;
    const producto = productosMonitoreados.find(p => p.id === selectedProducto);
    return producto?.producto?.nombre || 'Seleccionar producto';
  };

  const StatsCard = ({
    title,
    value,
    unit,
    icon: Icon,
    gradient,
    min,
    max,
    avg,
  }: {
    title: string;
    value: number;
    unit: string;
    icon: any;
    gradient: string[];
    min?: number;
    max?: number;
    avg?: number;
  }) => (
    <Animated.View entering={ZoomIn.springify()} style={tw`w-full mb-3`}>
      <GlassCard style={tw`p-4`}>
        <LinearGradient colors={gradient} style={tw`rounded-2xl p-4`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`bg-white/20 p-2 rounded-xl mr-3`}>
                <Icon stroke="#ffffff" width={20} height={20} strokeWidth={2.5} />
              </View>
              <Text style={tw`text-white/90 text-base font-semibold`}>{title}</Text>
            </View>
          </View>

          <View style={tw`mb-3`}>
            <Text style={tw`text-white text-3xl font-bold`}>
              {value.toFixed(1)}
              <Text style={tw`text-lg font-normal`}> {unit}</Text>
            </Text>
          </View>

          {(min !== undefined || max !== undefined || avg !== undefined) && (
            <View style={tw`flex-row justify-between mt-3 pt-3 border-t border-white/20`}>
              {min !== undefined && (
                <View>
                  <Text style={tw`text-white/70 text-xs`}>Mín</Text>
                  <Text style={tw`text-white text-sm font-semibold`}>{min.toFixed(1)}°</Text>
                </View>
              )}
              {avg !== undefined && (
                <View>
                  <Text style={tw`text-white/70 text-xs`}>Prom</Text>
                  <Text style={tw`text-white text-sm font-semibold`}>{avg.toFixed(1)}°</Text>
                </View>
              )}
              {max !== undefined && (
                <View>
                  <Text style={tw`text-white/70 text-xs`}>Máx</Text>
                  <Text style={tw`text-white text-sm font-semibold`}>{max.toFixed(1)}°</Text>
                </View>
              )}
            </View>
          )}
        </LinearGradient>
      </GlassCard>
    </Animated.View>
  );

  return (
    <MainLayout title="Histórico de Monitoreo">
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={tw`mb-6`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`flex-row items-center mb-4`}
          >
            <ArrowLeft stroke="#374151" width={24} height={24} style={tw`mr-2`} />
            <Text style={tw`text-gray-700 text-base font-semibold`}>Volver</Text>
          </TouchableOpacity>

          <Text style={tw`text-4xl font-extrabold text-gray-900 mb-2`}>
            Histórico de Datos
          </Text>
          <Text style={tw`text-gray-600 text-lg`}>
            Análisis histórico de monitoreo
          </Text>
        </Animated.View>

        {/* Producto Selector */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={tw`mb-4`}>
          <GlassCard style={tw`p-4`}>
            <Text style={tw`text-gray-700 text-sm font-semibold mb-2`}>Producto</Text>
            <TouchableOpacity
              onPress={() => setShowProductoDropdown(!showProductoDropdown)}
              style={tw`flex-row items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-200`}
            >
              <View style={tw`flex-row items-center flex-1`}>
                <Box stroke="#3b82f6" width={20} height={20} style={tw`mr-2`} />
                <Text style={tw`text-gray-900 text-base font-medium`}>
                  {getProductoName()}
                </Text>
              </View>
              <ChevronDown
                stroke="#6b7280"
                width={20}
                height={20}
                style={[
                  tw`ml-2`,
                  showProductoDropdown && { transform: [{ rotate: '180deg' }] },
                ]}
              />
            </TouchableOpacity>

            {showProductoDropdown && (
              <View style={tw`mt-2 bg-white rounded-xl border border-gray-200`}>
                {productosMonitoreados.map((producto) => (
                  <TouchableOpacity
                    key={producto.id}
                    onPress={() => {
                      setSelectedProducto(producto.id);
                      setShowProductoDropdown(false);
                    }}
                    style={[
                      tw`p-3 border-b border-gray-100`,
                      selectedProducto === producto.id && tw`bg-blue-50`,
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-base`,
                        selectedProducto === producto.id
                          ? tw`text-blue-600 font-semibold`
                          : tw`text-gray-700`,
                      ]}
                    >
                      {producto.producto?.nombre}
                    </Text>
                    <Text style={tw`text-sm text-gray-500 mt-0.5`}>
                      {producto.localizacion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Date Range Picker */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`mb-4`}>
          <GlassCard style={tw`p-4`}>
            <View style={tw`flex-row items-center mb-3`}>
              <Calendar stroke="#3b82f6" width={20} height={20} style={tw`mr-2`} />
              <Text style={tw`text-gray-700 text-base font-semibold`}>Rango de Fechas</Text>
            </View>

            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                style={tw`flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200 mr-2`}
              >
                <Text style={tw`text-gray-600 text-xs mb-1`}>Desde</Text>
                <Text style={tw`text-gray-900 text-base font-semibold`}>
                  {format(startDate, 'dd/MM/yyyy', { locale: es })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                style={tw`flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200 ml-2`}
              >
                <Text style={tw`text-gray-600 text-xs mb-1`}>Hasta</Text>
                <Text style={tw`text-gray-900 text-base font-semibold`}>
                  {format(endDate, 'dd/MM/yyyy', { locale: es })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Date Ranges */}
            <View style={tw`flex-row mt-3 space-x-2`}>
              {[
                { label: '7 días', days: 7 },
                { label: '15 días', days: 15 },
                { label: '30 días', days: 30 },
              ].map((range) => (
                <TouchableOpacity
                  key={range.label}
                  onPress={() => {
                    setStartDate(subDays(new Date(), range.days));
                    setEndDate(new Date());
                  }}
                  style={tw`flex-1 bg-blue-50 rounded-lg py-2 px-3 border border-blue-200`}
                >
                  <Text style={tw`text-blue-600 text-xs font-semibold text-center`}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}

        {loading ? (
          <View style={tw`py-12`}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={tw`text-gray-600 text-center mt-4`}>Cargando datos históricos...</Text>
          </View>
        ) : historicoData.length > 0 ? (
          <>
            {/* Stats Cards */}
            <Animated.View entering={FadeInUp.delay(300).springify()} style={tw`mb-4`}>
              <Text style={tw`text-xl font-bold text-gray-900 mb-3`}>Resumen del Período</Text>

              <StatsCard
                title="Temperatura Promedio"
                value={
                  historicoData.reduce((sum, r) => sum + r.temperatura, 0) /
                  historicoData.length
                }
                unit="°C"
                icon={Thermometer}
                gradient={['#f97316', '#fb923c']}
                min={Math.min(...historicoData.map(r => r.temperatura))}
                max={Math.max(...historicoData.map(r => r.temperatura))}
                avg={
                  historicoData.reduce((sum, r) => sum + r.temperatura, 0) /
                  historicoData.length
                }
              />

              <StatsCard
                title="Humedad Promedio"
                value={
                  historicoData.reduce((sum, r) => sum + r.humedad, 0) /
                  historicoData.length
                }
                unit="%"
                icon={Activity}
                gradient={['#3b82f6', '#60a5fa']}
              />

              <StatsCard
                title="Nivel de Luz Promedio"
                value={
                  historicoData.reduce((sum, r) => sum + r.lux, 0) /
                  historicoData.length
                }
                unit="lux"
                icon={Sun}
                gradient={['#eab308', '#facc15']}
              />
            </Animated.View>

            {/* Historical Records Table */}
            <Animated.View entering={FadeInUp.delay(400).springify()} style={tw`mb-4`}>
              <Text style={tw`text-xl font-bold text-gray-900 mb-3`}>Registros</Text>

              <GlassCard style={tw`p-4`}>
                {historicoData.slice(0, 10).map((registro, index) => (
                  <View
                    key={registro.id}
                    style={[
                      tw`py-3 border-b border-gray-100`,
                      index === historicoData.slice(0, 10).length - 1 && tw`border-b-0`,
                    ]}
                  >
                    <View style={tw`flex-row justify-between items-center mb-2`}>
                      <Text style={tw`text-gray-900 text-base font-semibold`}>
                        {format(new Date(registro.fecha), 'dd/MM/yyyy, HH:mm', { locale: es })}
                      </Text>
                    </View>

                    <View style={tw`flex-row justify-between`}>
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row items-center`}>
                          <Thermometer stroke="#f97316" width={14} height={14} style={tw`mr-1`} />
                          <Text style={tw`text-gray-700 text-sm`}>Temp:</Text>
                          <Text style={tw`text-gray-900 text-sm font-semibold ml-1`}>
                            {registro.temperatura.toFixed(1)}°C
                          </Text>
                        </View>
                      </View>

                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row items-center`}>
                          <Activity stroke="#3b82f6" width={14} height={14} style={tw`mr-1`} />
                          <Text style={tw`text-gray-700 text-sm`}>Hum:</Text>
                          <Text style={tw`text-gray-900 text-sm font-semibold ml-1`}>
                            {registro.humedad.toFixed(1)}%
                          </Text>
                        </View>
                      </View>

                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row items-center`}>
                          <Sun stroke="#eab308" width={14} height={14} style={tw`mr-1`} />
                          <Text style={tw`text-gray-700 text-sm`}>Luz:</Text>
                          <Text style={tw`text-gray-900 text-sm font-semibold ml-1`}>
                            {registro.lux.toFixed(0)} lux
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                {historicoData.length > 10 && (
                  <View style={tw`py-3 border-t border-gray-200 mt-2`}>
                    <Text style={tw`text-center text-gray-600 text-sm`}>
                      Mostrando 10 de {historicoData.length} registros
                    </Text>
                  </View>
                )}
              </GlassCard>
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={ZoomIn.springify()} style={tw`py-12`}>
            <View style={tw`items-center`}>
              <Box stroke="#9ca3af" width={64} height={64} strokeWidth={1.5} />
              <Text style={tw`text-gray-600 text-base mt-4 text-center`}>
                No hay datos históricos para este producto en el rango de fechas seleccionado
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </MainLayout>
  );
};

export default HistoricoMonitoreoScreen;
