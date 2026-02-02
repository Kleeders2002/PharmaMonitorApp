// src/infrastructure/network/ReactNativeNetworkAdapter.ts
import NetInfo from '@react-native-community/netinfo';
import { NetworkService } from '../../core/domain/NetworkService';
import api from '../../../api'

export class ReactNativeNetworkAdapter implements NetworkService {
  async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!state.isConnected;
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await api.get('/health', { // Quitar la barra final si es necesario
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Health-Check': 'true' // Header opcional para identificar checks
        }
      });
      
      return response.status === 200 && 
             response.data?.status === 'OK' && 
             response.data?.version === '1.0.0'; // Validación estricta
    } catch (error) {
      //console.error('Health check error:', error);
      return false;
    }
  }

  monitorConnection(callback: (isConnected: boolean) => void): () => void {
    return NetInfo.addEventListener(state => {
      callback(!!state.isConnected);
    });
  }
}

