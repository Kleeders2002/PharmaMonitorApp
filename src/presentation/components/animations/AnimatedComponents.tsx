// src/presentation/components/animations/AnimatedComponents.tsx
import React from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  FadeInUp,
} from 'react-native-reanimated';
import tw from 'twrnc';

// ============= STAGGER CHILDREN =============
interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  style?: ViewStyle;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 100,
  style,
}) => {
  const childArray = React.Children.toArray(children);

  return (
    <View style={style}>
      {childArray.map((child, index) => (
        <Animated.View
          key={index}
          entering={FadeInUp.delay(index * staggerDelay)
            .springify()
            .mass(0.8)}
        >
          {child as React.ReactElement}
        </Animated.View>
      ))}
    </View>
  );
};

// ============= GLASSMORPHISM CARD =============
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurAmount?: number;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  blurAmount = 20,
  intensity = 0.85,
}) => {
  return (
    <Animated.View
      entering={FadeInUp.springify().mass(0.8)}
      style={[
        tw`bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30`,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};
