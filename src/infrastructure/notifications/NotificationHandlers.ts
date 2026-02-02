// // src/infrastructure/notifications/NotificationHandlers.ts
// import { Platform } from 'react-native';
// import PushNotification from 'react-native-push-notification';
// import { CommonActions, NavigationContainerRef } from '@react-navigation/native';
// import { RootStackParamList } from '../../presentation/navigation/types';

// // Tipo para los datos personalizados de la notificación
// export interface CustomNotificationData {
//   alertId?: number;
//   [key: string]: any;
// }

// // Referencia a la navegación
// let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

// // Configurar la referencia de navegación
// export const setNavigationReference = (ref: NavigationContainerRef<RootStackParamList>) => {
//   navigationRef = ref;
// };

// // Navegar a una pantalla
// export const navigateToScreen = (name: keyof RootStackParamList, params?: any) => {
//   if (navigationRef && navigationRef.isReady()) {
//     navigationRef.dispatch(CommonActions.navigate({ name, params }));
//   }
// };

// // Configurar el canal de notificaciones (Android)
// const configureNotificationChannel = () => {
//   if (Platform.OS === 'android') {
//     PushNotification.createChannel(
//       {
//         channelId: "pharma-channel",
//         channelName: "Pharma Monitor Notifications",
//         channelDescription: "Channel for Pharma Monitor alerts",
//         importance: 4,
//         vibrate: true,
//       },
//       (created) => console.log(`Channel created: ${created}`)
//     );
//   }
// };

// // Manejar el toque en una notificación
// const handleNotificationTap = (notification: any) => {
//   console.log('Notificación tocada:', notification);
//   const data = notification.userInfo || notification.data || {};
  
//   if (data.alertId) {
//     navigateToScreen('AlertasScreen', {
//       focusOnAlertId: data.alertId
//     });
//   }
// };

// // Configurar los escuchas de notificaciones
// export const setupNotificationListeners = () => {
//   // Primero configuramos el canal de notificaciones
//   configureNotificationChannel();

//   // Luego configuramos los listeners
//   PushNotification.configure({
//     // REQUIRED: Se llamó cuando se recibe una notificación remota o local
//     onNotification: function (notification) {
//       console.log('Notificación recibida:', notification);
      
//       if (notification.userInteraction) {
//         handleNotificationTap(notification);
//       }

//       if (Platform.OS === 'ios' && notification.finish) {
//         notification.finish('backgroundFetchResultNoData');
//       }
//     },

//     // REQUIRED: Se llamó cuando se registra el token
//     onRegister: function (token) {
//       console.log('TOKEN:', token);
//     },

//     // Permisos
//     requestPermissions: Platform.OS === 'ios',
//     popInitialNotification: true,
//   });

//   return () => {
//     console.log('Limpiando escuchas de notificaciones');
//   };
// };