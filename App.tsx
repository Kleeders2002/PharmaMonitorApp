import React, { useEffect } from 'react';
import { NetworkProvider } from './src/core/application/NetworkMonitor';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import GlobalNetworkStatus from './src/presentation/components/GlobalNetworkStatus';
import { UserProvider } from './src/context/UserContext';
import { ProductosProvider } from './src/context/ProductContext';
import { CondicionesProvider } from './src/context/CondicionesContext';
import { RegistrosProvider } from './src/context/RegistroContext';
import { PerfilProvider } from './src/context/PerfilContext';
import { AlertasProvider } from './src/context/AlertasContext';
import { MonitoreoProvider } from './src/context/MonitoreoContext';
import NotificationService from './src/services/NotificationService';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

export default function App() {
  // Inicializar notificaciones al iniciar la app
  useEffect(() => {
    const initializeApp = async () => {
      // Solicitar permisos de notificaciones
      await NotificationService.requestPermissions();
      
      // Restaurar notificaciones activas si la app se cerró
      await NotificationService.restoreActiveNotifications();
    };

    initializeApp();

    // Limpiar listeners al cerrar la app
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  return (
    <NetworkProvider>
      <UserProvider>
        <ProductosProvider>
          <CondicionesProvider>
            <RegistrosProvider>
              <PerfilProvider>
                <AlertasProvider>
                  <MonitoreoProvider>
                    <AppNavigator />
                    <GlobalNetworkStatus />
                  </MonitoreoProvider>
                </AlertasProvider>
              </PerfilProvider>
            </RegistrosProvider>
          </CondicionesProvider>
        </ProductosProvider>
      </UserProvider>
    </NetworkProvider>
  );
}