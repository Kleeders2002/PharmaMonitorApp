// // src/infrastructure/notifications/PermissionsService.ts
// import { Platform, PermissionsAndroid } from 'react-native';
// import PushNotification from 'react-native-push-notification';

// export const requestNotificationPermissions = async () => {
//   try {
//     // En iOS y Android utilizamos PushNotification para solicitar permisos
//     PushNotification.requestPermissions();
    
//     // Para Android 13+ (API 33+) necesitamos permiso específico de notificaciones
//     if (Platform.OS === 'android' && Platform.Version >= 33) {
//       const granted = await PermissionsAndroid.request(
//         'android.permission.POST_NOTIFICATIONS',
//         {
//           title: 'Permisos de notificaciones',
//           message: 'Necesitamos tu permiso para enviar notificaciones.',
//           buttonNeutral: 'Preguntar después',
//           buttonNegative: 'Cancelar',
//           buttonPositive: 'OK',
//         },
//       );
//       return granted === PermissionsAndroid.RESULTS.GRANTED;
//     }
    
//     return true;
//   } catch (err) {
//     console.error("Error solicitando permisos:", err);
//     return false;
//   }
// };

// export const setupPermissions = async () => {
//   try {
//     const hasPermission = await requestNotificationPermissions();
//     console.log('Permiso de notificaciones:', hasPermission ? 'concedido' : 'denegado');
//     return hasPermission;
//   } catch (error) {
//     console.error('Error al solicitar permisos:', error);
//     return false;
//   }
// };