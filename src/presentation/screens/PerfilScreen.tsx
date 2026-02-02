// src/presentation/screens/PerfilScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  TextInput,
  Alert,
  Platform,
  RefreshControl,
  KeyboardAvoidingView
} from 'react-native';
import tw from 'twrnc';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  X, 
  ChevronLeft, 
  AlertTriangle,
  Check
} from 'react-native-feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import MainLayout from '../layouts/MainLayout';
import { useUser as useUserContext } from '../../context/UserContext'; // Importar el UserContext
import { useUser as usePerfilContext } from '../../context/PerfilContext'; // Mantener PerfilContext para actualizaciones
import * as ImagePicker from 'expo-image-picker';

// Interface for password form state
interface PasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

const PerfilScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Usar ambos contextos
  const { 
    userData: userFromAuthContext, 
    refreshUserData
  } = useUserContext();
  
  const { 
    error, 
    success, 
    isSubmitting, 
    refreshing,
    updateUserProfile,
    updateUserPassword,
    uploadProfileImage,
    clearMessages
  } = usePerfilContext();
  
  // Local state
  const [loading, setLoading] = useState<boolean>(false);
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [userData, setUserData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    foto: null as string | null,
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    newPassword: '',
    confirmPassword: '',
  });

  // Effect para cargar datos del usuario desde UserContext en lugar de fetchUserProfile
  useEffect(() => {
    setLoading(true);
    
    if (userFromAuthContext) {
      setUserData({
        nombre: userFromAuthContext.nombre || '',
        apellido: userFromAuthContext.apellido || '',
        email: userFromAuthContext.email || '',
        foto: userFromAuthContext.foto || null,
      });
    }
    
    setLoading(false);
  }, [userFromAuthContext]);

  // Effect to clear messages when switching forms
  useEffect(() => {
    clearMessages();
  }, [showPasswordForm]);

  // Handle image picker
  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
      } as any);

      // Upload image
      const imageUrl = await uploadProfileImage(formData);
      if (imageUrl) {
        setUserData(prev => ({ ...prev, foto: imageUrl }));
        
        // Update profile with new image via PerfilContext
        await updateUserProfile({
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          foto: imageUrl
        });
        
        // Refresh user data in UserContext to reflect changes
        await refreshUserData();
      }
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro que deseas eliminar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          setUserData(prev => ({ ...prev, foto: null }));
          
          await updateUserProfile({
            nombre: userData.nombre,
            apellido: userData.apellido,
            email: userData.email,
            foto: null
          });
          
          // Refresh user data in UserContext
          await refreshUserData();
        }}
      ]
    );
  };

  // Handle profile update
  const handleSubmitProfile = async () => {
    // Usar updateUserProfile de PerfilContext para actualizar perfil
    await updateUserProfile({
      nombre: userData.nombre,
      apellido: userData.apellido,
      email: userData.email, // Mantener correo original
      foto: userData.foto
    });
    
    // Refrescar datos en UserContext después de actualizar
    if (!error && success) {
      await refreshUserData();
    }
  };

  // Handle password update
  const handleSubmitPassword = async () => {
    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    // Update password
    await updateUserPassword(passwordForm.newPassword);
    
    // Reset form on success
    if (!error) {
      setPasswordForm({
        newPassword: '',
        confirmPassword: '',
      });
      
      // Show success alert and switch back to profile
      if (success) {
        Alert.alert('Éxito', success, [
          { text: 'OK', onPress: () => setShowPasswordForm(false) }
        ]);
      }
    }
  };

  // Función para refrescar los datos del usuario
  const handleRefresh = async () => {
    await refreshUserData();
  };

  // Render status message
  const renderStatusMessage = () => {
    if (error) {
      return (
        <View style={tw`px-4 py-3 mb-4 bg-red-50 rounded-xl flex-row items-center`}>
          <AlertTriangle stroke="#ef4444" width={20} height={20} />
          <Text style={tw`ml-2 text-red-700 flex-1`}>{error}</Text>
        </View>
      );
    }
    
    if (success) {
      return (
        <View style={tw`px-4 py-3 mb-4 bg-green-50 rounded-xl flex-row items-center`}>
          <Check stroke="#10b981" width={20} height={20} />
          <Text style={tw`ml-2 text-green-700 flex-1`}>{success}</Text>
        </View>
      );
    }
    
    return null;
  };

  // Render content based on active form
  const renderContent = () => {
    if (loading) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-600`}>Cargando perfil...</Text>
        </View>
      );
    }

    if (showPasswordForm) {
      return (
        <View style={tw`p-4`}>
          <View style={tw`bg-blue-50 p-6 rounded-xl mb-6`}>
            <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Cambio de Contraseña</Text>
            
            {renderStatusMessage()}
            
            <View style={tw`mb-4`}>
              <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Nueva Contraseña</Text>
              <View style={tw`flex-row items-center bg-white rounded-xl border border-gray-200 px-3 py-2`}>
                <Lock stroke="#3b82f6" width={18} height={18} />
                <TextInput
                  style={tw`flex-1 ml-2 text-base text-gray-800 py-1`}
                  secureTextEntry
                  placeholder="Ingresa tu nueva contraseña"
                  placeholderTextColor="#a1a1aa"
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                />
              </View>
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Confirmar Contraseña</Text>
              <View style={tw`flex-row items-center bg-white rounded-xl border border-gray-200 px-3 py-2`}>
                <Lock stroke="#3b82f6" width={18} height={18} />
                <TextInput
                  style={tw`flex-1 ml-2 text-base text-gray-800 py-1`}
                  secureTextEntry
                  placeholder="Confirma tu nueva contraseña"
                  placeholderTextColor="#a1a1aa"
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                />
              </View>
            </View>
          </View>

          <View style={tw`flex-row gap-4`}>
            <TouchableOpacity
              style={tw`flex-1 rounded-xl border border-gray-200 py-3 flex-row justify-center items-center`}
              onPress={() => setShowPasswordForm(false)}
            >
              <ChevronLeft stroke="#374151" width={18} height={18} />
              <Text style={tw`ml-2 text-base font-medium text-gray-700`}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-1 rounded-xl bg-blue-600 py-3 flex-row justify-center items-center`}
              onPress={handleSubmitPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={tw`text-base font-medium text-white`}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`p-4`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3b82f6"]}
              tintColor="#3b82f6"
            />
          }
        >
          {/* Photo upload section */}
          <View style={tw`items-center mb-6`}>
            <TouchableOpacity
              style={tw`w-32 h-32 rounded-full overflow-hidden border-2 border-blue-200 bg-gray-50 items-center justify-center shadow-md`}
              onPress={handleImagePick}
            >
              {userData.foto ? (
                <Image
                  source={{ uri: userData.foto }}
                  style={tw`w-full h-full`}
                  resizeMode="cover"
                />
              ) : (
                <View style={tw`items-center justify-center`}>
                  <Camera stroke="#3b82f6" width={32} height={32} />
                  <Text style={tw`text-xs text-gray-500 mt-2`}>Subir foto</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {userData.foto && (
              <TouchableOpacity
                style={tw`bg-white shadow-sm rounded-full p-2 mt-2`}
                onPress={handleRemoveImage}
              >
                <X stroke="#ef4444" width={18} height={18} />
              </TouchableOpacity>
            )}

            <Text style={tw`text-xs text-gray-500 mt-2`}>
              Formatos: JPG, PNG • Máximo 5MB
            </Text>
          </View>

          {renderStatusMessage()}

          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Nombre</Text>
            <View style={tw`flex-row items-center bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm`}>
              <User stroke="#3b82f6" width={18} height={18} />
              <TextInput
                style={tw`flex-1 ml-2 text-base text-gray-800 py-1`}
                placeholder="Tu nombre"
                placeholderTextColor="#a1a1aa"
                value={userData.nombre}
                onChangeText={(text) => setUserData(prev => ({ ...prev, nombre: text }))}
              />
            </View>
          </View>

          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Apellido</Text>
            <View style={tw`flex-row items-center bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm`}>
              <User stroke="#3b82f6" width={18} height={18} />
              <TextInput
                style={tw`flex-1 ml-2 text-base text-gray-800 py-1`}
                placeholder="Tu apellido"
                placeholderTextColor="#a1a1aa"
                value={userData.apellido}
                onChangeText={(text) => setUserData(prev => ({ ...prev, apellido: text }))}
              />
            </View>
          </View>

          <View style={tw`mb-8`}>
            <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Correo Electrónico</Text>
            <View style={tw`flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 shadow-sm`}>
              <Mail stroke="#6b7280" width={18} height={18} />
              <Text style={tw`flex-1 ml-2 text-base text-gray-500 py-1 italic`}>
                {userData.email || 'Correo no disponible'}
              </Text>
            </View>
            <Text style={tw`text-xs text-gray-400 mt-1 italic`}>
              El correo electrónico no se puede modificar
            </Text>
          </View>

          <TouchableOpacity
            style={tw`bg-blue-600 rounded-xl py-4 items-center mb-4 shadow-md`}
            onPress={handleSubmitProfile}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={tw`text-white font-medium text-base`}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-row items-center justify-center py-3 mb-4`}
            onPress={() => setShowPasswordForm(true)}
          >
            <Lock stroke="#3b82f6" width={16} height={16} />
            <Text style={tw`ml-2 text-blue-600 font-medium`}>Cambiar Contraseña</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <MainLayout title="Mi Perfil">
      <View style={tw`flex-1 bg-gray-50`}>
        {/* Header */}
        <View style={tw`px-4 py-4 bg-white border-b border-gray-100 shadow-sm`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Mi Perfil</Text>
          <Text style={tw`text-sm text-gray-500`}>
            Administra tu información personal
          </Text>
        </View>
        
        {renderContent()}
      </View>
    </MainLayout>
  );
};

export default PerfilScreen;