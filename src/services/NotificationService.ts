// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

interface AlertaNotification {
  id: number;
  mensaje: string;
  parametro_afectado: string;
  valor_medido: number;
  producto: string;
  localizacion: string;
}

class NotificationService {
  private notificationListener: any;
  private responseListener: any;
  private activeNotifications = new Map<number, string>(); // alertaId -> notificationId

  constructor() {
    this.setupNotificationListeners();
  }

  // Configurar listeners de notificaciones
  private setupNotificationListeners() {
    // Listener para notificaciones recibidas mientras la app está abierta
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);
    });

    // Listener para cuando el usuario interactúa con la notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuario interactuó con notificación:', response);
      const alertaId = response.notification.request.content.data?.alertaId;
      if (alertaId) {
        // Aquí puedes navegar a la pantalla de alertas si es necesario
        // navigation.navigate('AlertasScreen');
      }
    });
  }

  // Solicitar permisos de notificaciones
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Las notificaciones push solo funcionan en dispositivos físicos');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('No se obtuvieron permisos para notificaciones');
      return false;
    }

    // Configurar el canal de notificaciones para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alertas-criticas', {
        name: 'Alertas Críticas',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    return true;
  }

  // Crear notificación persistente para una alerta
  async createPersistentAlertNotification(alerta: AlertaNotification): Promise<void> {
    try {
      // Verificar si ya existe una notificación para esta alerta
      if (this.activeNotifications.has(alerta.id)) {
        console.log('Ya existe una notificación para esta alerta:', alerta.id);
        return;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Alerta Crítica de Monitoreo',
          body: `${alerta.mensaje}\n📍 ${alerta.localizacion}`,
          data: { 
            alertaId: alerta.id,
            type: 'alerta-critica',
            persistent: true 
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          badge: 1,
          categoryIdentifier: 'alertas',
          // Android específico
          ...(Platform.OS === 'android' && {
            channelId: 'alertas-criticas',
            sticky: true, // Hace que la notificación sea persistente
            ongoing: true, // No se puede deslizar para quitar
            autoCancel: false, // No se cancela automáticamente
          }),
        },
        trigger: null, // Mostrar inmediatamente
      });

      // Guardar el ID de la notificación
      this.activeNotifications.set(alerta.id, notificationId);
      await this.saveActiveNotifications();

      console.log('Notificación persistente creada para alerta:', alerta.id);
    } catch (error) {
      console.error('Error creando notificación persistente:', error);
    }
  }

  // Cancelar notificación cuando la alerta se resuelve
  async cancelAlertNotification(alertaId: number): Promise<void> {
    try {
      const notificationId = this.activeNotifications.get(alertaId);
      
      if (notificationId) {
        await Notifications.dismissNotificationAsync(notificationId);
        this.activeNotifications.delete(alertaId);
        await this.saveActiveNotifications();
        
        console.log('Notificación cancelada para alerta:', alertaId);
      }
    } catch (error) {
      console.error('Error cancelando notificación:', error);
    }
  }

  // Cancelar todas las notificaciones activas
  async cancelAllAlertNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      this.activeNotifications.clear();
      await this.saveActiveNotifications();
      
      console.log('Todas las notificaciones canceladas');
    } catch (error) {
      console.error('Error cancelando todas las notificaciones:', error);
    }
  }

  // Actualizar notificación existente (si cambia el valor)
  async updateAlertNotification(alerta: AlertaNotification): Promise<void> {
    try {
      // Cancelar la notificación anterior
      await this.cancelAlertNotification(alerta.id);
      
      // Crear una nueva notificación actualizada
      await this.createPersistentAlertNotification(alerta);
    } catch (error) {
      console.error('Error actualizando notificación:', error);
    }
  }

  // Obtener contador de notificaciones activas
  getActiveNotificationsCount(): number {
    return this.activeNotifications.size;
  }

  // Verificar si existe notificación para una alerta
  hasNotificationForAlert(alertaId: number): boolean {
    return this.activeNotifications.has(alertaId);
  }

  // Guardar notificaciones activas en AsyncStorage
  private async saveActiveNotifications(): Promise<void> {
    try {
      const notificationsMap = Array.from(this.activeNotifications.entries());
      await AsyncStorage.setItem('active_notifications', JSON.stringify(notificationsMap));
    } catch (error) {
      console.error('Error guardando notificaciones activas:', error);
    }
  }

  // Restaurar notificaciones activas desde AsyncStorage
  async restoreActiveNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('active_notifications');
      if (stored) {
        const notificationsMap = JSON.parse(stored);
        this.activeNotifications = new Map(notificationsMap);
      }
    } catch (error) {
      console.error('Error restaurando notificaciones activas:', error);
    }
  }

  // Limpiar listeners (importante para evitar memory leaks)
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Obtener token de push notifications (para futuras implementaciones con backend)
  async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Reemplazar con tu project ID de Expo
      });
      
      console.log('Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error obteniendo push token:', error);
      return null;
    }
  }
}

// Exportar instancia singleton
export default new NotificationService();