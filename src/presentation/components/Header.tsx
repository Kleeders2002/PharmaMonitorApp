// src/presentation/components/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import tw from 'twrnc';
import { Bell, User, Menu } from 'react-native-feather';

// Wrap Bell component with forwardRef for animation support
const ForwardedBell = React.forwardRef<any, any>((props, ref) => <Bell {...props} />);
const AnimatedBell = Animated.createAnimatedComponent(ForwardedBell);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface HeaderProps {
  title: string;
  alertCount: number;
  onMenuPress: () => void;
  onAlertPress: () => void;
  onProfilePress: () => void;
  userData: {
    nombre: string;
    apellido: string;
    rol: string;
    foto: string;
  };
}

const Header: React.FC<HeaderProps> = ({
  title,
  alertCount,
  onMenuPress,
  onAlertPress,
  onProfilePress,
  userData,
}) => {
  // Animation values
  const bellScale = useSharedValue(1);
  const bellRotation = useSharedValue(0);
  const menuScale = useSharedValue(1);

  // Animate bell when alertCount changes
  React.useEffect(() => {
    if (alertCount > 0) {
      bellScale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
      bellRotation.value = withSequence(
        withTiming(-0.2, { duration: 100 }),
        withTiming(0.2, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }
  }, [alertCount]);

  const animatedBellStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bellScale.value },
      { rotate: `${bellRotation.value}rad` },
    ],
  }));

  const handleMenuPressIn = () => {
    menuScale.value = withSpring(0.9, { damping: 10 });
  };

  const handleMenuPressOut = () => {
    menuScale.value = withSpring(1, { damping: 10 });
  };

  const animatedMenuStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
  }));

  const handleAlertPressIn = () => {
    bellScale.value = withSpring(0.9, { damping: 10 });
  };

  const handleAlertPressOut = () => {
    bellScale.value = withSpring(1, { damping: 10 });
  };

  return (
    <SafeAreaView edges={['top']} style={tw`bg-white z-30`}>
      {/* Gradient bottom border */}
      <View style={tw`h-0.5`}>
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`w-full h-full`}
        />
      </View>

      <View style={tw`px-4 py-3`}>
        <View style={tw`flex-row items-center justify-between`}>
          {/* Profile Avatar with Animation */}
          <AnimatedTouchableOpacity
            onPress={onProfilePress}
            onPressIn={handleMenuPressIn}
            onPressOut={handleMenuPressOut}
            style={[
              animatedMenuStyle,
              tw`w-12 h-12 shadow-md`,
            ]}
          >
            <View style={tw`w-full h-full rounded-full overflow-hidden border-2 border-white shadow-lg`}>
              {userData.foto ? (
                <Image
                  source={{ uri: userData.foto }}
                  style={tw`w-full h-full`}
                  resizeMode="cover"
                />
              ) : (
                <View style={tw`w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center`}>
                  <User stroke="#ffffff" width={24} height={24} strokeWidth={2} />
                </View>
              )}
            </View>
          </AnimatedTouchableOpacity>

          {/* Logo */}
          <View style={tw`flex-1 items-center`}>
            <Image
              source={require('../../../assets/logo.png')}
              style={tw`w-14 h-14`}
              resizeMode="contain"
            />
          </View>

          {/* Alert Bell with Animation */}
          <AnimatedTouchableOpacity
            onPress={onAlertPress}
            onPressIn={handleAlertPressIn}
            onPressOut={handleAlertPressOut}
            style={tw`relative p-2 mr-2`}
          >
            <Animated.View style={animatedBellStyle}>
              <AnimatedBell
                stroke={alertCount > 0 ? '#ef4444' : '#374151'}
                width={26}
                height={26}
                strokeWidth={2}
                fill={alertCount > 0 ? '#fef2f2' : 'none'}
              />
            </Animated.View>
            {alertCount > 0 && (
              <Animated.View
                style={[
                  tw`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full min-w-[22px] h-[22px] items-center justify-center shadow-lg border-2 border-white`,
                ]}
              >
                <Text style={tw`text-white text-xs font-bold`}>
                  {alertCount > 9 ? '9+' : alertCount}
                </Text>
              </Animated.View>
            )}
          </AnimatedTouchableOpacity>
        </View>

        {/* Title with subtle gradient text effect */}
        <View style={tw`mt-2`}>
          <Text style={tw`text-center text-lg font-bold text-gray-800`}>
            {title}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Header;
