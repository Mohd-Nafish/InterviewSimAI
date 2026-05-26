import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { gradients } from '../constants/theme';

export type CategoryCardProps = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryCard({
  label,
  description,
  icon,
  selected,
  onPress,
}: CategoryCardProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    glow.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [selected, glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      }}
      style={animatedStyle}
      className="w-full overflow-hidden rounded-3xl border border-white/10"
    >
      <LinearGradient
        colors={[...gradients.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 14 }}
      >
        <Animated.View
          pointerEvents="none"
          style={overlayStyle}
          className="absolute inset-0"
        >
          <LinearGradient
            colors={[...gradients.cardActive]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <View
          className={`mb-3 h-10 w-10 items-center justify-center rounded-2xl ${
            selected ? 'bg-brand-500/25' : 'bg-white/10'
          }`}
        >
          <Ionicons
            name={icon}
            size={20}
            color={selected ? '#34D399' : '#CBD5E1'}
          />
        </View>
        <Text
          numberOfLines={1}
          className="text-[15px] font-semibold text-white"
        >
          {label}
        </Text>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{
            marginTop: 4,
            fontSize: 11,
            lineHeight: 15,
            minHeight: 30,
            color: '#AAB7C8',
          }}
          className="text-ink-300"
        >
          {description}
        </Text>
        {selected ? (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 10,
              height: 10,
              borderRadius: 10,
              backgroundColor: '#34D399',
              shadowColor: '#34D399',
              shadowOpacity: 0.6,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 4,
            }}
          />
        ) : null}
      </LinearGradient>
    </AnimatedPressable>
  );
}
