// src/presentation/navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductosScreen from '../screens/ProductosScreen';
import AlertasScreen from '../screens/AlertasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import CondicionesScreen from '../screens/CondicionesScreen';
import AgregarMonitoreoScreen from '../screens/AgregarMonitoreoScreen';
import ConsultarMetricasScreen from '../screens/ConsultarMetricasScreen';
import RegistrosScreen from '../screens/RegistrosScreen';
import HistoricoMonitoreoScreen from '../screens/HistoricoMonitoreoScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Oculta el header en todas las pantallas
          contentStyle: {
            backgroundColor: '#ffffff' // Fondo blanco para todas las pantallas
          }
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PerfilScreen" component={PerfilScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ProductosScreen" component={ProductosScreen} />
        <Stack.Screen name="CondicionesScreen" component={CondicionesScreen} />
        <Stack.Screen name="RegistrosScreen" component={RegistrosScreen} />
        <Stack.Screen name="AlertasScreen" component={AlertasScreen} />
        <Stack.Screen name="AgregarMonitoreoScreen" component={AgregarMonitoreoScreen} />
        <Stack.Screen name="ConsultarMetricas" component={ConsultarMetricasScreen} />
        <Stack.Screen name="HistoricoMonitoreo" component={HistoricoMonitoreoScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;