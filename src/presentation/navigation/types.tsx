// src/presentation/navigation/types.tsx
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AlertasScreen: undefined;
  PerfilScreen: undefined;
  Configuracion: undefined;
  ProductosScreen: undefined;
  CondicionesScreen: undefined;
  AgregarMonitoreoScreen: undefined;
  ConsultarMetricas: undefined;
  RegistrosScreen: undefined;
  HistoricoMonitoreo: { productoId?: number; productoNombre?: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}