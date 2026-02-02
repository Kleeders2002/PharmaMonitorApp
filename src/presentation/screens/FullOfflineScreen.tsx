// src/presentation/screens/FullOfflineScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useNetwork } from '../../core/application/NetworkMonitor';

type ScreenType = 'internet' | 'backend';

interface FullOfflineScreenProps {
  type: ScreenType;
  autoRetry?: boolean;
  retryInterval?: number;
}

export default function FullOfflineScreen({ 
  type, 
  autoRetry = false,
  retryInterval = 5
}: FullOfflineScreenProps) {
  const { checkConnection, checkBackendStatus } = useNetwork();
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const performChecks = async () => {
      await checkConnection();
      if (type === 'backend') {
        await checkBackendStatus();
      }
    };

    if (autoRetry) {
      intervalId = setInterval(performChecks, retryInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRetry, retryInterval, type]);

  const handleRetry = async () => {
    await checkConnection();
    if (type === 'backend') {
      await checkBackendStatus();
    }
  };

  const getConfig = () => {
    const baseStyle = 'flex-1 justify-center items-center p-8';
    
    const config = {
      internet: {
        style: `${baseStyle} bg-blue-50`,
        icon: '📶',
        title: 'Conexión a Internet Requerida',
        message: 'Para acceder a PharmaMonitor necesitas conexión estable.',
        button: 'bg-blue-600'
      },
      backend: {
        style: `${baseStyle} bg-orange-50`,
        icon: '⚙️',
        title: 'Servidor No Disponible',
        message: `Estamos teniendo dificultades técnicas.\n${
          autoRetry ? 'Reintentando conexión automáticamente...' : 'Por favor intenta nuevamente más tarde.'
        }`,
        button: 'bg-orange-600'
      }
    };

    return config[type];
  };

  const { style, icon, title, message, button } = getConfig();

  return (
    <View style={tw`${style}`}>
      <Text style={tw`text-6xl mb-6`}>{icon}</Text>
      
      <Text style={tw`text-2xl font-bold text-center text-gray-800 mb-4 px-4`}>
        {title}
      </Text>
      
      <Text style={tw`text-lg text-center text-gray-600 mb-8 px-6 leading-6`}>
        {message}
      </Text>

      {!autoRetry && (
        <TouchableOpacity 
          style={tw`${button} rounded-xl py-4 px-8 shadow-lg`}
          onPress={handleRetry}
        >
          <Text style={tw`text-white text-lg font-semibold`}>
            {type === 'backend' ? 'Reintentar conexión' : 'Verificar conexión'}
          </Text>
        </TouchableOpacity>
      )}

      {type === 'backend' && (
        <Text style={tw`mt-8 text-blue-600 text-sm`}>
          Contactar soporte: kleesteban27@gmail.com
        </Text>
      )}

      {autoRetry && (
        <Text style={tw`mt-4 text-gray-500 text-sm`}>
          Reintentos automáticos cada {retryInterval} segundos
        </Text>
      )}
    </View>
  );
}