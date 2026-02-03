// src/presentation/components/Sidebar.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated2, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInRight,
  Layout,
  ZoomIn,
} from 'react-native-reanimated';
import tw from 'twrnc';
import {
  User,
  LogOut,
  AlertTriangle,
  Package,
  FileText,
  Activity,
  ChevronRight,
  PieChart,
  Plus,
  List,
  X,
  Home,
  TrendingUp,
} from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../api';
import { RootStackParamList } from '../navigation/types';

interface UserData {
  nombre: string;
  apellido: string;
  foto: string;
  rol: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  sidebarTranslateX?: Animated.Value;
}

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  screen: keyof RootStackParamList;
  active?: boolean;
  subItems?: {
    icon: React.ComponentType<any>;
    label: string;
    screen: keyof RootStackParamList;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  userData,
  sidebarTranslateX,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const statusBarHeight =
    Platform.OS === 'ios' ? StatusBar.currentHeight || 44 : StatusBar.currentHeight || 0;

  const translateX = sidebarTranslateX || new Animated.Value(-320);

  if (!isOpen && !sidebarTranslateX) return null;

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      if (token) {
        await api.post(
          '/logout',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
      }

      await AsyncStorage.multiRemove(['access_token', 'user', 'lastUpdate']);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error en logout:', error);
      await AsyncStorage.multiRemove(['access_token', 'user', 'lastUpdate']);
      navigation.navigate('Login' as any);
    }
  };

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const menuItems: MenuItem[] = [
    { icon: User, label: 'Perfil', screen: 'PerfilScreen' },
    { icon: Home, label: 'Dashboard', screen: 'Dashboard' },
    { icon: Package, label: 'Productos', screen: 'ProductosScreen' },
    { icon: FileText, label: 'Condiciones', screen: 'CondicionesScreen' },
    {
      icon: Activity,
      label: 'Monitoreo',
      screen: 'AgregarMonitoreoScreen',
      subItems: [
        { icon: Plus, label: 'Agregar Monitoreo', screen: 'AgregarMonitoreoScreen' },
        { icon: PieChart, label: 'Consultar Métricas', screen: 'ConsultarMetricas' },
        { icon: TrendingUp, label: 'Histórico', screen: 'HistoricoMonitoreo' },
      ],
    },
    { icon: AlertTriangle, label: 'Alertas', screen: 'AlertasScreen' },
    { icon: List, label: 'Registros', screen: 'RegistrosScreen' },
  ];

  const isCurrentRoute = (screen: string): boolean => {
    const state = navigation.getState();
    const currentRoute = state.routes[state.index];
    console.log('Current route:', currentRoute.name, 'Checking against:', screen);
    return currentRoute.name === screen;
  };

  return (
    <Animated.View
      style={tw.style(
        `absolute top-0 left-0 h-full w-80 bg-white shadow-2xl z-50`,
        {
          paddingTop: statusBarHeight,
          transform: [{ translateX }],
        }
      )}
    >
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-4`}
      >
        {/* Header with Gradient */}
        <Animated2.View entering={ZoomIn.springify()} style={tw`p-6 mb-4`}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`rounded-3xl p-6 shadow-xl`}
          >
            <View style={tw`flex-row items-center mb-3`}>
              {userData.foto ? (
                <Image
                  source={{ uri: userData.foto }}
                  style={tw`w-20 h-20 rounded-2xl border-2 border-white/80 shadow-lg`}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={tw`w-20 h-20 rounded-2xl bg-white/20 items-center justify-center border-2 border-white/80 shadow-lg`}
                >
                  <User stroke="#ffffff" width={36} height={36} strokeWidth={2} />
                </View>
              )}

              <View style={tw`ml-4 flex-1`}>
                <Text
                  style={tw`text-xl font-bold text-white mb-1.5`}
                  numberOfLines={1}
                >
                  {userData.nombre} {userData.apellido}
                </Text>
                <View style={tw`bg-white/25 self-start px-3 py-1.5 rounded-full backdrop-blur-sm`}>
                  <Text style={tw`text-sm text-white font-semibold`}>
                    {userData.rol}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated2.View>

        {/* Menu Items */}
        <View style={tw`px-4`}>
          {menuItems.map((item, index) => {
            const isActive =
              isCurrentRoute(item.screen) ||
              (item.subItems &&
                item.subItems.some((sub) => isCurrentRoute(sub.screen)));

            return (
              <View key={index}>
                <TouchableOpacity
                  style={[
                    tw`flex-row items-center py-3.5 px-4 rounded-2xl mb-2`,
                    isActive
                      ? tw`bg-blue-600 shadow-lg border-2 border-blue-700`
                      : tw`bg-gray-50`,
                  ]}
                  onPress={() => {
                    if (item.subItems) {
                      toggleSubmenu(item.label);
                    } else {
                      navigation.navigate(item.screen as never);
                      onClose();
                    }
                  }}
                  activeOpacity={0.9}
                >
                  <item.icon
                    stroke={isActive ? '#ffffff' : '#374151'}
                    width={22}
                    height={22}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      tw`flex-1 ml-3 font-semibold text-base`,
                      isActive ? tw`text-white` : tw`text-gray-700`,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.subItems && <ChevronRight stroke={isActive ? '#ffffff' : '#6b7280'} width={18} height={18} strokeWidth={2} />}
                </TouchableOpacity>

                {/* Submenu */}
                {item.subItems && expandedMenu === item.label && (
                  <Animated2.View
                    entering={FadeIn.springify()}
                    layout={Layout.springify()}
                  >
                    {item.subItems.map((subItem, subIndex) => (
                      <TouchableOpacity
                        key={`sub-${subIndex}`}
                        style={[
                          tw`flex-row items-center py-2.5 px-4 rounded-xl mb-2 ml-4`,
                          isCurrentRoute(subItem.screen)
                            ? tw`bg-blue-100 border border-blue-300`
                            : tw`bg-gray-100`,
                        ]}
                        onPress={() => {
                          navigation.navigate(subItem.screen as never);
                          onClose();
                        }}
                      >
                        <subItem.icon
                          stroke={isCurrentRoute(subItem.screen) ? '#2563eb' : '#6b7280'}
                          width={18}
                          height={18}
                          strokeWidth={2.5}
                        />
                        <Text
                          style={[
                            tw`ml-3 text-sm font-medium`,
                            isCurrentRoute(subItem.screen)
                              ? tw`text-blue-800 font-semibold`
                              : tw`text-gray-600`,
                          ]}
                        >
                          {subItem.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Animated2.View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer with Logout */}
      <Animated2.View entering={FadeIn.delay(300)} style={tw`p-4 border-t border-gray-100 bg-gray-50`}>
        <TouchableOpacity
          style={tw`flex-row items-center py-3.5 px-4 rounded-2xl bg-red-50`}
          onPress={handleLogout}
        >
          <LogOut stroke="#ef4444" width={22} height={22} strokeWidth={2} />
          <Text style={tw`ml-3 font-semibold text-red-600`}>Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated2.View>

      {/* Close Button */}
      <TouchableOpacity
        onPress={onClose}
        style={tw`absolute top-4 right-4 p-2.5 rounded-full bg-white shadow-lg border border-gray-100`}
      >
        <X stroke="#374151" width={20} height={20} strokeWidth={2} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Sidebar;
