// src/core/application/NetworkMonitor.ts
import { createContext, useContext, useEffect, useState, ReactNode, FC, useCallback, useMemo } from 'react';
import { NetworkService } from '../domain/NetworkService';
import { ReactNativeNetworkAdapter } from '../../infrastructure/network/ReactNativeNetworkAdapter';

interface NetworkContextValue {
  isConnected: boolean;
  isBackendAlive: boolean;
  checkConnection: () => Promise<void>;
  checkBackendStatus: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: true,
  isBackendAlive: true,
  checkConnection: async () => {},
  checkBackendStatus: async () => {},
});

export const NetworkProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const networkService = useMemo(() => new ReactNativeNetworkAdapter(), []);
  const [isConnected, setIsConnected] = useState(true);
  const [isBackendAlive, setIsBackendAlive] = useState(true);

  const checkConnection = useCallback(async () => {
    try {
      const connected = await networkService.isConnected();
      setIsConnected(connected);
      if (connected) await checkBackendStatus();
    } catch (error) {
      setIsConnected(false);
      setIsBackendAlive(false);
    }
  }, [networkService]);

  const checkBackendStatus = useCallback(async () => {
    try {
      const backendOk = await networkService.checkBackendHealth();
      setIsBackendAlive(backendOk);
    } catch (error) {
      setIsBackendAlive(false);
    }
  }, [networkService]);

  // Chequeo periódico del backend cada 10 segundos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected) {
      interval = setInterval(() => {
        checkBackendStatus();
      }, 10000);
    }
    
    return () => clearInterval(interval);
  }, [isConnected, checkBackendStatus]);

  // Monitor de conexión existente
  useEffect(() => {
    const unsubscribe = networkService.monitorConnection(async (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        await checkBackendStatus();
      } else {
        setIsBackendAlive(false);
      }
    });

    return () => unsubscribe();
  }, [networkService, checkBackendStatus]);

  return (
    <NetworkContext.Provider 
      value={{ 
        isConnected, 
        isBackendAlive,
        checkConnection,
        checkBackendStatus 
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextValue => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork debe usarse dentro de NetworkProvider');
  }
  return context;
};