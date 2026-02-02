// src/presentation/components/OfflineBanner.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useNetwork } from '../../core/application/NetworkMonitor';

interface OfflineBannerProps {
  type: 'internet';
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ type }) => {
  const { checkConnection } = useNetwork();

  const messages = {
    internet: {
      text: 'Sin conexión a Internet',
      color: 'bg-blue-600',
    }
  };

  const handleRetry = async () => {
    await checkConnection();
  };

  return (
    <View style={tw`${messages[type].color} p-4`}>
      <View style={tw`flex-row items-center justify-between`}>
        <Text style={tw`text-white font-medium`}>
          ⚠️ {messages[type].text}
        </Text>
        
        <TouchableOpacity 
          onPress={handleRetry}
          style={tw`bg-white/10 px-4 py-2 rounded-lg`}
        >
          <Text style={tw`text-white font-semibold`}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OfflineBanner;