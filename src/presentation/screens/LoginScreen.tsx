import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Image, 
  ScrollView,
  Platform,
  ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNetwork } from '../../core/application/NetworkMonitor';
import tw from "twrnc";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api, { setNavigation } from "../../../api";
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { isConnected } = useNetwork();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocus, setInputFocus] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Configurar la referencia de navegación para los interceptores
  useEffect(() => {
    setNavigation(navigation);
  }, [navigation]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/check-auth', { 
          withCredentials: true 
        });
        console.log('Auth check response:', response.data);
        
        if (response.data.authenticated) {
          // Guardar datos del usuario si están disponibles
          if (response.data.user) {
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          }
          
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Dashboard" }]
            })
          );
        }
      } catch (error) {
    console.log("Usuario no autenticado:", error);
    await AsyncStorage.removeItem('user'); // Solo limpia usuario
  }
    };

    if (isConnected) checkAuth();
  }, [isConnected, navigation]);

  const handleLogin = async () => {
    if (!isConnected) {
      Alert.alert("Sin conexión", "Necesitas internet para iniciar sesión");
      return;
    }
  
    if (!email || !password) {
      setError("Por favor complete todos los campos");
      return;
    }
  
    setError("");
    setIsLoading(true);
  
    try {
      const response = await api.post("/login", { 
        email, 
        password 
      }, {
        withCredentials: true
      });
  
      console.log('Login response:', response.data);
  
      // Guardar usuario en AsyncStorage
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
  
      // Guardar tokens si vienen en la respuesta (formato JSON)
      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
      }
      if (response.data.refresh_token) {
        await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      }
  
      // Verificar si los tokens vienen en cookies (headers)
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        for (const cookie of cookies) {
          if (cookie.includes('access_token=')) {
            const accessToken = cookie.match(/access_token=([^;]+)/)?.[1];
            if (accessToken) {
              await AsyncStorage.setItem('access_token', accessToken.replace('Bearer ', ''));
            }
          }
          if (cookie.includes('refresh_token=')) {
            const refreshToken = cookie.match(/refresh_token=([^;]+)/)?.[1];
            if (refreshToken) {
              await AsyncStorage.setItem('refresh_token', refreshToken.replace('Bearer ', ''));
            }
          }
        }
      }
  
      // Debug: Verificar lo que se guardó
      const storedToken = await AsyncStorage.getItem('access_token');
      console.log('Token almacenado:', storedToken);
  
      // Redirigir al Dashboard
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Dashboard" }]
        })
      );
  
    } catch (error: any) {
      console.error('Error de login:', error);
      
      let errorMessage = "Error de conexión. Intente nuevamente";
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Credenciales inválidas";
        } else if (error.response.data) {
          errorMessage = error.response.data.detail || 
                       error.response.data.message || 
                       errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Por favor ingrese un correo electrónico válido");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/forgot-password", { email });
      
      if (response.status === 200) {
        setError("✔️ Se ha enviado un correo con las instrucciones");
        setTimeout(() => setShowForgotPassword(false), 3000);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Error al procesar la solicitud";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#f0f9ff", "#e0f2fe"]}
      style={tw`flex-1`}
    >
      <ScrollView 
        contentContainerStyle={tw`flex-grow justify-center px-4`}
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw`bg-white rounded-3xl shadow-xl shadow-blue-100/50 overflow-hidden`}>
          {/* Header Section */}
          {Platform.OS === "web" && (
            <LinearGradient
              colors={["#2563eb", "#0284c7"]}
              style={tw`h-56 justify-center items-center pb-8`}
            >
              <Image
                source={require("../../../assets/logoinverse.png")}
                style={tw`w-28 h-28 mb-6`}
                resizeMode="contain"
              />
              <Text style={tw`text-white text-3xl font-bold tracking-tight`}>PharmaMonitor</Text>
              <Text style={tw`text-blue-100 text-lg mt-3 font-medium`}>
                Sistema Integral de Monitoreo Farmacéutico
              </Text>
            </LinearGradient>
          )}

          <View style={tw`p-8`}>
            <View style={tw`items-center mb-10`}>
              {Platform.OS !== "web" && (
                <View style={tw`mb-6`}>
                  <Image
                    source={require("../../../assets/logoinverse.png")}
                    style={tw`w-20 h-20`}
                    resizeMode="contain"
                  />
                </View>
              )}
              
              <Text style={tw`text-3xl font-bold text-gray-900 mb-3`}>
                {showForgotPassword ? "Recuperar Acceso" : "Bienvenido"}
              </Text>
              <Text style={tw`text-gray-500 text-center text-base leading-6`}>
                {showForgotPassword
                  ? "Ingrese su correo electrónico registrado para restablecer su contraseña"
                  : "Ingrese sus credenciales para acceder al sistema"}
              </Text>
            </View>

            <View style={tw`mb-8`}>
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm text-gray-700 font-medium mb-3`}>Correo Electrónico</Text>
                <View style={[
                  tw`flex-row items-center bg-gray-50 rounded-xl px-5 py-4 border-2`,
                  inputFocus === 'email' ? tw`border-blue-500 bg-white` : tw`border-gray-100`
                ]}>
                  <Feather 
                    name="mail" 
                    size={20} 
                    color={inputFocus === 'email' ? "#3b82f6" : "#6b7280"} 
                  />
                  <TextInput
                    style={tw`flex-1 ml-4 text-gray-900 text-base`}
                    placeholder="ejemplo@farmacia.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setInputFocus('email')}
                    onBlur={() => setInputFocus(null)}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {!showForgotPassword && (
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm text-gray-700 font-medium mb-3`}>Contraseña</Text>
                  <View style={[
                    tw`flex-row items-center bg-gray-50 rounded-xl px-5 py-4 border-2`,
                    inputFocus === 'password' ? tw`border-blue-500 bg-white` : tw`border-gray-100`
                  ]}>
                    <Feather
                      name="lock"
                      size={20}
                      color={inputFocus === 'password' ? "#3b82f6" : "#6b7280"}
                    />
                    <TextInput
                      style={tw`flex-1 ml-4 text-gray-900 text-base`}
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setInputFocus('password')}
                      onBlur={() => setInputFocus(null)}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={tw`ml-2 p-1`}
                      disabled={isLoading}
                    >
                      <Feather
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                        color={inputFocus === 'password' ? "#3b82f6" : "#6b7280"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {error !== "" && (
                <View style={tw`p-4 mb-4 rounded-xl ${
                  error.includes("✔️") ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"
                }`}>
                  <View style={tw`flex-row items-center`}>
                    <Feather 
                      name={error.includes("✔️") ? "check-circle" : "alert-circle"} 
                      size={18} 
                      color={error.includes("✔️") ? "#059669" : "#dc2626"} 
                      style={tw`mr-3`}
                    />
                    <Text style={tw`${error.includes("✔️") ? "text-emerald-700" : "text-red-700"} text-sm leading-5`}>
                      {error}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={showForgotPassword ? handleForgotPassword : handleLogin}
                disabled={isLoading}
                style={tw`w-full bg-blue-600 rounded-xl py-5 shadow-lg mb-4 ${
                  isLoading ? "opacity-90" : "active:opacity-90"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={tw`text-white text-center font-semibold text-lg tracking-wide`}>
                    {showForgotPassword 
                      ? "Enviar Instrucciones" 
                      : "Iniciar Sesión"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowForgotPassword(!showForgotPassword);
                  setError("");
                }}
                style={tw`items-center`}
                disabled={isLoading}
              >
                <View style={tw`flex-row items-center`}>
                  {showForgotPassword && (
                    <AntDesign 
                      name="arrowleft" 
                      size={16} 
                      color="#2563eb" 
                      style={tw`mr-2`}
                    />
                  )}
                  <Text style={tw`text-blue-600 font-medium text-base ${
                    !showForgotPassword ? "underline" : ""
                  }`}>
                    {showForgotPassword 
                      ? "Volver al inicio de sesión"
                      : "¿Olvidaste tu contraseña?"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default LoginScreen;