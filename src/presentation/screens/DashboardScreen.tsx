// src/presentation/screens/DashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';
import {
  AlertTriangle,
  Package,
  Activity,
  FileText,
  CheckCircle,
  Clock,
  Box,
  ChevronRight,
  Zap,
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
  ZoomIn,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainLayout from '../layouts/MainLayout';
import { useAlertas } from '../../context/AlertasContext';
import { useProductos } from '../../context/ProductContext';
import { useMonitoreo } from '../../context/MonitoreoContext';
import { RootStackParamList } from '../navigation/types';
import { GlassCard, StaggerContainer } from '../components/animations';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalAlertas: number;
  alertasPendientes: number;
  productosMonitoreados: number;
  totalProductos: number;
}

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { alertas, pendingAlertas, fetchAlertas } = useAlertas();
  const { productos, fetchProductos } = useProductos();
  const { productosMonitoreados, fetchProductosMonitoreados } = useMonitoreo();

  const [stats, setStats] = useState<DashboardStats>({
    totalAlertas: 0,
    alertasPendientes: 0,
    productosMonitoreados: 0,
    totalProductos: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const pulseValue = useSharedValue(1);

  const updateStats = useCallback(() => {
    setStats({
      totalAlertas: alertas.length,
      alertasPendientes: pendingAlertas.length,
      productosMonitoreados: productosMonitoreados.length,
      totalProductos: productos.length,
    });
  }, [alertas, productos, productosMonitoreados, pendingAlertas.length]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAlertas(),
        fetchProductos(),
        fetchProductosMonitoreados(),
      ]);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    updateStats();
  }, [updateStats]);

  useEffect(() => {
    if (stats.alertasPendientes > 0) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [stats.alertasPendientes, pulseValue]);

  // StatCard Component
  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
    gradient,
    onPress,
    delay,
  }: {
    icon: any;
    title: string;
    value: number;
    color: string;
    gradient: string[];
    onPress?: () => void;
    delay: number;
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      'worklet';
      scale.value = withSpring(0.97, { damping: 10 });
    };

    const handlePressOut = () => {
      'worklet';
      scale.value = withSpring(1, { damping: 10 });
    };

    return (
      <Animated.View entering={FadeInUp.delay(delay).springify()}>
        <View style={tw`w-full mb-3`}>
          <Animated.View style={animatedStyle}>
            <GlassCard style={tw`p-5`}>
              <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!onPress}
              >
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tw`rounded-2xl p-4`}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-gray-700 text-sm font-semibold mb-2`}>{title}</Text>
                      <Text style={tw`text-4xl font-bold text-gray-900`}>{value}</Text>
                    </View>
                    <View
                      style={[
                        tw`p-4 rounded-2xl shadow-lg`,
                        { backgroundColor: `${color}20` },
                      ]}
                    >
                      <Icon stroke={color} width={32} height={32} strokeWidth={2.5} />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </GlassCard>
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  // RecentAlert Component
  const RecentAlert = ({ alerta, index, hasAlerts }: { alerta: any; index: number; hasAlerts: boolean }) => {
    const localPulse = useSharedValue(1);

    useEffect(() => {
      if (hasAlerts) {
        localPulse.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
      }
    }, [hasAlerts, localPulse]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: localPulse.value }],
    }));

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100).springify()}
        style={tw`bg-gradient-to-r from-red-50 to-red-100/50 rounded-2xl p-4 mb-3 border border-red-200`}
      >
        <View style={tw`flex-row items-start justify-between`}>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Animated.View style={animatedStyle}>
                <Zap width={18} height={18} stroke="#ef4444" strokeWidth={2.5} />
              </Animated.View>
              <Text style={tw`text-red-800 font-bold text-sm ml-2`}>ALERTA ACTIVA</Text>
            </View>
            <Text style={tw`text-red-900 font-semibold text-base mb-2`}>
              {alerta.mensaje}
            </Text>
            <View style={tw`flex-row items-center`}>
              <Clock width={14} height={14} stroke="#b91c1c" />
              <Text style={tw`text-red-700 text-xs ml-1.5 font-medium`}>
                Hace{' '}
                {Math.floor(
                  (Date.now() - new Date(alerta.fecha_generacion).getTime()) / 60000
                )}{' '}
                min
              </Text>
            </View>
          </View>
          <View style={tw`bg-red-500 px-3 py-2 rounded-xl shadow-md`}>
            <Text style={tw`text-white text-sm font-bold`}>
              {alerta.valor_medido.toFixed(1)}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // QuickAction Component - Professional Square Design
  const QuickAction = ({
    icon: Icon,
    title,
    subtitle,
    gradient,
    onPress,
    delay,
  }: {
    icon: any;
    title: string;
    subtitle: string;
    gradient: string[];
    onPress: () => void;
    delay: number;
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      'worklet';
      scale.value = withSpring(0.95, { damping: 10 });
    };

    const handlePressOut = () => {
      'worklet';
      scale.value = withSpring(1, { damping: 10 });
    };

    return (
      <Animated.View entering={ZoomIn.delay(delay).springify()}>
        <View style={tw`w-full mb-4`}>
          <Animated.View style={animatedStyle}>
            <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
              <GlassCard>
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tw`rounded-2xl p-4 shadow-lg`}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={tw`bg-white/25 p-3 rounded-xl mr-3 shadow-sm`}>
                        <Icon stroke="#ffffff" width={26} height={26} strokeWidth={2.5} />
                      </View>
                      <View style={tw`flex-1 ml-1`}>
                        <Text style={tw`text-white font-bold text-base`} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={tw`text-white/90 text-sm mt-0.5`} numberOfLines={1}>
                          {subtitle}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight stroke="#ffffff" width={20} height={20} strokeWidth={2} />
                  </View>
                </LinearGradient>
              </GlassCard>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  // SystemStatus Component
  const SystemStatus = () => {
    const hasAlerts = stats.alertasPendientes > 0;

    return (
      <Animated.View entering={FadeInUp.delay(600).springify()}>
        <GlassCard style={tw`p-5`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Estado del Sistema</Text>

          <StatusItem
            icon={<Activity width={18} height={18} stroke="#10b981" />}
            label="Monitoreo Activo"
            status="Operativo"
            color="green"
          />

          <StatusItem
            icon={<Zap width={18} height={18} stroke={hasAlerts ? '#ef4444' : '#10b981'} />}
            label="Alertas Críticas"
            status={hasAlerts ? `${stats.alertasPendientes} activas` : 'Normal'}
            color={hasAlerts ? 'red' : 'green'}
          />

          <StatusItem
            icon={<Box width={18} height={18} stroke="#3b82f6" />}
            label="Conexión Backend"
            status="Conectado"
            color="blue"
          />
        </GlassCard>
      </Animated.View>
    );
  };

  // StatusItem Component
  const StatusItem = ({
    icon,
    label,
    status,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    status: string;
    color: 'green' | 'red' | 'blue';
  }) => {
    const colorMap = {
      green: { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
      red: { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
      blue: { bg: '#dbeafe', text: '#2563eb', dot: '#3b82f6' },
    };

    const colors = colorMap[color];

    return (
      <View style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={[tw`w-2.5 h-2.5 rounded-full mr-3`, { backgroundColor: colors.dot }]}
          />
          <Text style={tw`text-gray-700 font-medium`}>{label}</Text>
        </View>
        <View
          style={[
            tw`px-3 py-1 rounded-full`,
            { backgroundColor: colors.bg },
          ]}
        >
          <Text style={[tw`text-sm font-bold`, { color: colors.text }]}>{status}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-600 font-medium`}>Cargando dashboard...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Welcome Header */}
        <Animated.View
          entering={FadeInDown.springify()}
        >
          <GlassCard style={tw`p-5 mb-6`}>
            <Text style={tw`text-4xl font-extrabold text-gray-900 mb-2`}>Panel de Control</Text>
            <Text style={tw`text-gray-600 text-base leading-relaxed`}>
              Vista general del sistema de monitoreo
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Stats Section */}
        <View style={tw`mb-6`}>
          <StatCard
            icon={AlertTriangle}
            title="Alertas Pendientes"
            value={stats.alertasPendientes}
            color="#ef4444"
            gradient={['#fecaca', '#fca5a5']}
            onPress={() => navigation.navigate('AlertasScreen')}
            delay={0}
          />
          <StatCard
            icon={CheckCircle}
            title="Total Alertas"
            value={stats.totalAlertas}
            color="#3b82f6"
            gradient={['#bfdbfe', '#93c5fd']}
            delay={100}
          />
          <StatCard
            icon={Activity}
            title="En Monitoreo"
            value={stats.productosMonitoreados}
            color="#10b981"
            gradient={['#6ee7b7', '#34d399']}
            onPress={() => navigation.navigate('AgregarMonitoreoScreen')}
            delay={200}
          />
          <StatCard
            icon={Package}
            title="Total Productos"
            value={stats.totalProductos}
            color="#3b82f6"
            gradient={['#bfdbfe', '#93c5fd']}
            onPress={() => navigation.navigate('ProductosScreen')}
            delay={300}
          />
        </View>

        {/* Recent Alerts */}
        {pendingAlertas.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).springify()} style={tw`mb-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-xl font-bold text-gray-900`}>Alertas Recientes</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AlertasScreen')}
                style={tw`flex-row items-center`}
              >
                <Text style={tw`text-blue-600 font-semibold mr-1`}>Ver todas</Text>
                <ChevronRight stroke="#2563eb" width={18} height={18} />
              </TouchableOpacity>
            </View>
            {pendingAlertas.slice(0, 3).map((alerta, index) => (
              <RecentAlert
                key={alerta.id}
                alerta={alerta}
                index={index}
                hasAlerts={stats.alertasPendientes > 0}
              />
            ))}
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={tw`mb-4`}>
          <GlassCard style={tw`p-4 mb-4`}>
            <Text style={tw`text-xl font-bold text-gray-900 mb-4`}>Acciones Rápidas</Text>
            <View style={tw`flex-row flex-wrap justify-between`}>
            <QuickAction
              icon={Activity}
              title="Nuevo Monitoreo"
              subtitle="Agregar producto"
              gradient={['#3b82f6', '#2563eb']}
              onPress={() => navigation.navigate('AgregarMonitoreoScreen')}
              delay={0}
            />
            <QuickAction
              icon={Package}
              title="Ver Productos"
              subtitle="Catálogo completo"
              gradient={['#3b82f6', '#2563eb']}
              onPress={() => navigation.navigate('ProductosScreen')}
              delay={100}
            />
            <QuickAction
              icon={FileText}
              title="Condiciones"
              subtitle="Ver estándares"
              gradient={['#10b981', '#059669']}
              onPress={() => navigation.navigate('CondicionesScreen')}
              delay={200}
            />
            <QuickAction
              icon={Clock}
              title="Registros"
              subtitle="Historial sistema"
              gradient={['#f59e0b', '#d97706']}
              onPress={() => navigation.navigate('RegistrosScreen')}
              delay={300}
            />
            </View>
          </GlassCard>
        </Animated.View>

        {/* System Status */}
        <SystemStatus />

        {/* Monitored Products */}
        {productosMonitoreados.length > 0 && (
          <Animated.View entering={FadeInUp.delay(700).springify()} style={tw`mb-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-xl font-bold text-gray-900`}>
                Productos en Monitoreo
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AgregarMonitoreoScreen')}
                style={tw`flex-row items-center`}
              >
                <Text style={tw`text-blue-600 font-semibold mr-1`}>Ver todos</Text>
                <ChevronRight stroke="#2563eb" width={18} height={18} />
              </TouchableOpacity>
            </View>

            <GlassCard style={tw`p-4`}>
              {productosMonitoreados.slice(0, 3).map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInUp.delay(index * 100).springify()}
                >
                  <View
                    style={[
                      tw`flex-row items-center justify-between py-3`,
                      index < 2 && tw`border-b border-gray-100`,
                    ]}
                  >
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={[tw`p-2.5 rounded-xl mr-3`, { backgroundColor: '#dbeafe' }]}>
                        <Box stroke="#3b82f6" width={20} height={20} strokeWidth={2} />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-gray-900 font-semibold text-base`} numberOfLines={1}>
                          {item.producto?.nombre || 'Producto'}
                        </Text>
                        <Text style={tw`text-gray-500 text-sm`}>{item.localizacion}</Text>
                      </View>
                    </View>
                    <View style={[tw`px-4 py-2 rounded-xl`, { backgroundColor: '#dbeafe' }]}>
                      <Text style={tw`text-blue-700 text-sm font-bold`}>
                        {item.cantidad} unid.
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </GlassCard>
          </Animated.View>
        )}

        {/* System Info */}
        <Animated.View entering={FadeInUp.delay(800).springify()} style={tw`mb-4`}>
          <Text style={tw`text-xl font-bold text-gray-900 mb-4`}>Información del Sistema</Text>
          <GlassCard style={tw`p-5`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-gray-600 font-medium text-sm`}>Última actualización</Text>
              <Text style={tw`text-gray-900 font-semibold text-sm`}>
                {new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-gray-600 font-medium text-sm`}>Versión del sistema</Text>
              <Text style={tw`text-gray-900 font-semibold text-sm`}>v1.0.0</Text>
            </View>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-gray-600 font-medium text-sm`}>Modo</Text>
              <View style={tw`bg-green-100 px-3 py-1.5 rounded-full`}>
                <Text style={tw`text-green-700 text-xs font-bold`}>Producción</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </MainLayout>
  );
};

export default DashboardScreen;
