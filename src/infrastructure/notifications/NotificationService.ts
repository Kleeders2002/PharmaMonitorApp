// // src/infrastructure/notifications/NotificationService.ts
// import PushNotification from 'react-native-push-notification';
// import { Platform } from 'react-native';

// export interface AlertNotification {
//   id: number;
//   title: string;
//   message: string;
//   productId: number;
//   productName: string;
//   parametro: string;
// }

// class NotificationService {
//   constructor() {
//     this.configureNotifications();
//   }

//   configureNotifications() {
//     // Configurar canales para Android (necesario para notificaciones persistentes)
//     PushNotification.createChannel(
//       {
//         channelId: 'alerts-channel',
//         channelName: 'Alertas de monitoreo',
//         channelDescription: 'Notificaciones para las alertas de productos monitoreados',
//         playSound: true,
//         soundName: 'default',
//         importance: 4, // Importance.HIGH en Android
//         vibrate: true,
//       },
//       (created) => console.log(`Canal de notificaciones ${created ? 'creado' : 'ya existente'}`)
//     );
//     // Otras configuraciones están en setupNotificationListeners
//   }

//   // Enviar una notificación para una alerta pendiente
//   sendAlertNotification(alert: AlertNotification) {
//     // Definir el color según el tipo de parámetro
//     let color = '#FF0000'; // Rojo por defecto
   
//     if (alert.parametro === 'temperatura') {
//       color = '#FF9500'; // Naranja para temperatura
//     } else if (alert.parametro === 'lux') {
//       color = '#FFCC00'; // Amarillo para lux
//     }
   
//     PushNotification.localNotification({
//       id: alert.id.toString(),  // Convierte ID a string
//       channelId: 'alerts-channel',
//       title: `⚠️ ${alert.title}`,
//       message: alert.message,
//       subText: alert.productName,
//       bigText: `${alert.message}\n\nProducto: ${alert.productName}`,
//       ongoing: Platform.OS === 'android', // Solo en Android: hace que la notificación sea persistente
//       priority: 'high',
//       visibility: 'public',
//       autoCancel: false, // No se cancela al tocarla
//       vibrate: true,
//       vibration: 300,
//       playSound: true,
//       soundName: 'default',
//       color: color,
//       userInfo: {
//         productId: alert.productId,
//         alertId: alert.id
//       }
//     });
//   }

//   // Actualizar una notificación existente (p.ej. si cambian los valores)
//   updateAlertNotification(alert: AlertNotification) {
//     // Primero eliminar la existente con ese ID
//     PushNotification.cancelLocalNotification(alert.id.toString());  // Convierte ID a string
//     // Luego crear una nueva
//     this.sendAlertNotification(alert);
//   }

//   // Eliminar una notificación cuando se resuelve la alerta
//   removeAlertNotification(alertId: number) {
//     PushNotification.cancelLocalNotification(alertId.toString());  // Convierte ID a string
//   }

//   // Limpiar todas las notificaciones
//   clearAllNotifications() {
//     PushNotification.cancelAllLocalNotifications();
//   }
 
//   // Establecer el badge (número) en el icono de la app (iOS y algunos Android)
//   setBadgeCount(count: number) {
//     PushNotification.setApplicationIconBadgeNumber(count);
//   }
// }

// // Exportar una instancia única del servicio
// export default new NotificationService();