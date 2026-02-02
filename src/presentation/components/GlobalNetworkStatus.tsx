// src/presentation/components/GlobalNetworkStatus.tsx
import React from 'react';
import { View } from 'react-native';
import { useNetwork } from '../../core/application/NetworkMonitor';
import FullOfflineScreen from '../screens/FullOfflineScreen';
import OfflineBanner from './OfflineBanner';
import tw from 'twrnc';

// src/presentation/components/GlobalNetworkStatus.tsx
export default function GlobalNetworkStatus() {
  const { isConnected, isBackendAlive } = useNetwork();

  if (!isConnected) {
    return (
      <View style={tw`absolute top-0 left-0 right-0 z-50`}>
        <OfflineBanner type="internet" />
      </View>
    );
  }

  if (!isBackendAlive) {
    return (
      <View style={tw`absolute top-0 left-0 right-0 bottom-0 bg-white z-50`}>
        <FullOfflineScreen 
          type="backend"
          autoRetry={true}
          retryInterval={5}
        />
      </View>
    );
  }

  return null; // Asegúrate de retornar null en lugar de un string vacío
}