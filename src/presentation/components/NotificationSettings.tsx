// src/presentation/components/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import tw from 'twrnc';
import { Bell, BellOff, AlertTriangle } from 'react-native-feather';
import NotificationService from '../../services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationSettings: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeNotificationsCount, setActiveNotificationsCount] = useState(0);

  useEffect(() => {
    loadSettings();
    updateNotificationCount();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('notifications_enabled');
      if (enabled !== null) {
        setNotificationsEnabled(enabled === 'true');
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const updateNotificationCount = () => {
    const count = NotificationService.getActiveNotificationsCount();
    setActiveNotificationsCount(count);
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      if (!value) {
        Alert.alert(
          'Desactivar Notificaciones',
          '¿Estás seguro? No recibirás alertas sobre condiciones críticas de almacenamiento.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Desactivar',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.setItem('notifications_enabled', 'false');
                setNotificationsEnabled(false);
                // Opcionalmente, cancelar todas las notificaciones activas
                await NotificationService.cancelAllAlertNotifications();
                updateNotificationCount();
              },
            },
          ]
        );
      } else {
        await AsyncStorage.setItem('notifications_enabled', 'true');
        setNotificationsEnabled(true);
        // Solicitar permisos nuevamente si es necesario
        await NotificationService.requestPermissions();
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Limpiar Notificaciones',
      '¿Deseas eliminar todas las notificaciones activas? Las alertas seguirán activas en el sistema.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await NotificationService.cancelAllAlertNotifications();
            updateNotificationCount();
            Alert.alert('Éxito', 'Todas las notificaciones han sido eliminadas');
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    await NotificationService.createPersistentAlertNotification({
      id: 9999,
      mensaje: 'Esta es una notificación de prueba',
      parametro_afectado: 'temperatura',
      valor_medido: 28.5,
      producto: 'Producto de Prueba',
      localizacion: 'Zona de Prueba',
    });
    
    updateNotificationCount();
    Alert.alert('Notificación Enviada', 'Revisa tu bandeja de notificaciones');
  };

  return (
    <View style={tw`bg-white rounded-xl shadow-md p-4 mb-4`}>
      <View style={tw`flex-row items-center mb-4`}>
        <Bell stroke="#3b82f6" width={24} height={24} />
        <Text style={tw`ml-2 text-lg font-bold text-gray-800`}>
          Configuración de Notificaciones
        </Text>
      </View>

      {/* Toggle de notificaciones */}
      <View style={tw`flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100`}>
        <View style={tw`flex-1`}>
          <Text style={tw`font-medium text-gray-800`}>Notificaciones Push</Text>
          <Text style={tw`text-sm text-gray-500`}>
            Recibe alertas de condiciones críticas
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          thumbColor={notificationsEnabled ? '#ffffff' : '#f3f4f6'}
        />
      </View>

      {/* Contador de notificaciones activas */}
      <View style={tw`bg-blue-50 p-3 rounded-lg mb-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <AlertTriangle stroke="#3b82f6" width={20} height={20} />
            <Text style={tw`ml-2 text-sm font-medium text-gray-700`}>
              Notificaciones Activas
            </Text>
          </View>
          <View style={tw`bg-blue-600 px-3 py-1 rounded-full`}>
            <Text style={tw`text-white font-bold`}>{activeNotificationsCount}</Text>
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={tw`flex-row gap-2`}>
        <TouchableOpacity
          style={tw`flex-1 bg-gray-100 py-3 rounded-lg items-center`}
          onPress={handleTestNotification}
        >
          <Text style={tw`text-gray-700 font-medium`}>Probar</Text>
        </TouchableOpacity>

        {activeNotificationsCount > 0 && (
          <TouchableOpacity
            style={tw`flex-1 bg-red-100 py-3 rounded-lg items-center`}
            onPress={handleClearAllNotifications}
          >
            <Text style={tw`text-red-700 font-medium`}>Limpiar Todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Información adicional */}
      <View style={tw`mt-4 bg-amber-50 p-3 rounded-lg`}>
        <Text style={tw`text-xs text-amber-800`}>
          💡 Las notificaciones permanecerán activas hasta que las alertas sean resueltas en el sistema.
        </Text>
      </View>
    </View>
  );
};

export default NotificationSettings;