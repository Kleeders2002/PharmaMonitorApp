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
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}