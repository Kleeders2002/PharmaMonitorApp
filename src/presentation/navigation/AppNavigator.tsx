// src/presentation/navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductosScreen from '../screens/ProductosScreen';
import AlertasScreen from '../screens/AlertasScreen';
import PerfilScreen from '../screens/PerfilScreen';
// import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import CondicionesScreen from '../screens/CondicionesScreen';
import AgregarMonitoreoScreen from '../screens/AgregarMonitoreoScreen';
import ConsultarMetricasScreen from '../screens/ConsultarMetricasScreen';
import RegistrosScreen from '../screens/RegistrosScreen';
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
        {/* <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />   SERÁ */}
        <Stack.Screen name="ConsultarMetricas" component={ConsultarMetricasScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

// Version Nueva

// // src/presentation/navigation/AppNavigator.tsx
// import React, { useEffect, useRef } from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
// import LoginScreen from '../screens/LoginScreen';
// import DashboardScreen from '../screens/DashboardScreen';
// import ProductosScreen from '../screens/ProductosScreen';
// import AlertasScreen from '../screens/AlertasScreen';
// import PerfilScreen from '../screens/PerfilScreen';
// // import ConfiguracionScreen from '../screens/ConfiguracionScreen';
// import CondicionesScreen from '../screens/CondicionesScreen';
// // import AgregarMonitoreoScreen from '../screens/AgregarMonitoreoScreen';
// // import ConsultarMetricasScreen from '../screens/ConsultarMetricasScreen';
// import RegistrosScreen from '../screens/RegistrosScreen';
// import { RootStackParamList } from './types';
// import { setupNotificationListeners, setNavigationReference } from '../../infrastructure/notifications/NotificationHandlers';
// import { setupPermissions } from '../../infrastructure/notifications/PermissionsService';

// const Stack = createNativeStackNavigator<RootStackParamList>();

// const AppNavigator = () => {
//   // Referencia a la navegación para poder acceder desde fuera
//   const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

//   // Configurar permisos y escuchas de notificaciones al iniciar la app
//   useEffect(() => {
//     // Solicitar permisos de notificaciones
//     setupPermissions();
    
//     // Pasar la referencia al servicio de notificaciones
//     if (navigationRef.current) {
//       setNavigationReference(navigationRef.current);
//     }
    
//     // Configurar manejadores de notificaciones
//     const cleanupListeners = setupNotificationListeners();
    
//     return () => {
//       // Limpiar escuchas al desmontar
//       cleanupListeners();
//     };
//   }, []);

//   return (
//     <NavigationContainer ref={navigationRef}>
//       <Stack.Navigator
//         initialRouteName="Login"
//         screenOptions={{
//           headerShown: false, // Oculta el header en todas las pantallas
//           contentStyle: {
//             backgroundColor: '#ffffff' // Fondo blanco para todas las pantallas
//           }
//         }}
//       >
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="PerfilScreen" component={PerfilScreen} />
//         <Stack.Screen name="Dashboard" component={DashboardScreen} />
//         <Stack.Screen name="ProductosScreen" component={ProductosScreen} />
//         <Stack.Screen name="CondicionesScreen" component={CondicionesScreen} />
//         <Stack.Screen name="RegistrosScreen" component={RegistrosScreen} />
//         <Stack.Screen name="AlertasScreen" component={AlertasScreen} />    
//         {/* <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />   SERÁ    
//         <Stack.Screen name="AgregarMonitoreo" component={AgregarMonitoreoScreen} /> 9 de Abril
//         <Stack.Screen name="ConsultarMetricas" component={ConsultarMetricasScreen} />  9 de Abril */}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;