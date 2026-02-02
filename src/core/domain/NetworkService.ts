// src/core/domain/NetworkService.ts
export interface NetworkService {
    isConnected(): Promise<boolean>;
    checkBackendHealth(): Promise<boolean>; // ← Añadir esta línea
    monitorConnection(callback: (isConnected: boolean) => void): () => void;
  }