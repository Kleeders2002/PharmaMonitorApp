// src/presentation/components/animations/AnimatedComponents.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  ZoomIn,
  LayoutAnimation,
} from 'react-native-reanimated';
import tw from 'twrnc';

// ============= SHIMMER LOADING EFFECT =============
interface ShimmerProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  delay?: number;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  style,
  delay = 0,
}) => {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(0.98);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.98, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        tw`bg-gray-200 rounded-lg`,
        { width, height },
        animatedStyle,
        style,
      ]}
    />
  );
};

// ============= FADE IN ANIMATION =============
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: 'top' | 'bottom' | 'left' | 'right';
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 400,
  from,
  style,
}) => {
  const entering = from
    ? from === 'top'
      ? FadeInDown.delay(delay).springify()
      : from === 'bottom'
      ? FadeInUp.delay(delay).springify()
      : from === 'left'
      ? SlideInRight.delay(delay).springify()
      : SlideInLeft.delay(delay).springify()
    : FadeIn.delay(delay).springify();

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
};

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

// ============= PULSE ANIMATION =============
interface PulseProps {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle;
}

export const Pulse: React.FC<PulseProps> = ({ children, intensity = 0.95, style }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
};

// ============= BOUNCE IN ANIMATION =============
interface BounceInProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

export const BounceIn: React.FC<BounceInProps> = ({ children, delay = 0, style }) => {
  return (
    <Animated.View entering={ZoomIn.delay(delay).springify().mass(0.5)} style={style}>
      {children}
    </Animated.View>
  );
};

// ============= SHAKE ANIMATION (for errors) =============
interface ShakeProps {
  children: React.ReactNode;
  trigger: boolean;
  style?: ViewStyle;
}

export const Shake: React.FC<ShakeProps> = ({ children, trigger, style }) => {
  const offset = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      offset.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50, easing: Easing.out(Easing.ease) })
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
};

// ============= PROGRESS BAR ANIMATION =============
interface AnimatedProgressProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  color = '#3b82f6',
  height = 8,
  style,
}) => {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View
      style={[
        tw`bg-gray-200 rounded-full overflow-hidden`,
        { height },
        style,
      ]}
    >
      <Animated.View
        style={[
          tw`h-full rounded-full`,
          { backgroundColor: color },
          animatedStyle,
        ]}
      />
    </View>
  );
};

// ============= CARD LIFT ANIMATION (on press) =============
interface CardLiftProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  liftAmount?: number;
}

export const CardLift: React.FC<CardLiftProps> = ({
  children,
  onPress,
  disabled = false,
  style,
  liftAmount = -4,
}) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(0.98, { damping: 10 });
    shadowOpacity.value = withSpring(0.2, { damping: 10 });
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, { damping: 10 });
    shadowOpacity.value = withSpring(0.1, { damping: 10 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Animated.View
        onStart={handlePressIn}
        onEnd={handlePressOut}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};

// ============= RIPPLE EFFECT =============
interface RippleProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  rippleColor?: string;
}

export const Ripple: React.FC<RippleProps> = ({
  children,
  onPress,
  style,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const handlePress = () => {
    scale.value = withTiming(3, { duration: 400, easing: Easing.out(Easing.ease) });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={style}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          tw`bg-gray-400 rounded-full`,
          animatedStyle,
          { width: 100, height: 100, left: '50%', top: '50%', marginLeft: -50, marginTop: -50 },
        ]}
      />
      {children}
    </View>
  );
};

// ============= ROTATION ANIMATION =============
interface RotateProps {
  children: React.ReactNode;
  rotating: boolean;
  style?: ViewStyle;
}

export const Rotate: React.FC<RotateProps> = ({ children, rotating, style }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (rotating) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [rotating]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
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

// ============= GRADIENT CARD =============
interface GradientCardProps {
  children: React.ReactNode;
  colors: string[];
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  colors,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}) => {
  // Note: For true gradients, you'd use expo-linear-gradient
  // This is a simplified version using background color
  return (
    <Animated.View
      entering={ZoomIn.springify().mass(0.5)}
      style={[
        tw`rounded-2xl shadow-lg`,
        { backgroundColor: colors[0] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};
