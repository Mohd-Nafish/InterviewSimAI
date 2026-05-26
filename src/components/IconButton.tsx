import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  label?: string;
  variant?: 'ghost' | 'solid' | 'danger';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const VARIANT_BG: Record<NonNullable<IconButtonProps['variant']>, string> = {
  ghost: 'rgba(255,255,255,0.08)',
  solid: 'rgba(16,185,129,0.18)',
  danger: 'rgba(239,68,68,0.18)',
};

const VARIANT_BORDER: Record<NonNullable<IconButtonProps['variant']>, string> = {
  ghost: 'rgba(255,255,255,0.10)',
  solid: 'rgba(16,185,129,0.32)',
  danger: 'rgba(239,68,68,0.32)',
};

export function IconButton({
  icon,
  onPress,
  disabled = false,
  size = 56,
  color,
  variant = 'ghost',
}: IconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const tint =
    color ??
    (variant === 'danger' ? '#FCA5A5' : variant === 'solid' ? '#34D399' : '#E2E8F0');

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 18, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          backgroundColor: VARIANT_BG[variant],
          borderColor: VARIANT_BORDER[variant],
        },
        animatedStyle,
      ]}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={Math.round(size * 0.4)} color={tint} />
      </View>
    </AnimatedPressable>
  );
}
