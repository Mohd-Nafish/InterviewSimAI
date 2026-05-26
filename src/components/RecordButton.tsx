import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type RecordButtonProps = {
  recording: boolean;
  disabled?: boolean;
  onPress: () => void;
  size?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RecordButton({
  recording,
  disabled = false,
  onPress,
  size = 92,
}: RecordButtonProps) {
  const pressScale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (recording) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.6, { duration: 1400, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.55, { duration: 0 }),
          withTiming(0, { duration: 1400, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(ringScale);
      cancelAnimation(ringOpacity);
      ringScale.value = withTiming(1, { duration: 200 });
      ringOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [recording, ringOpacity, ringScale]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const bg = recording ? '#EF4444' : '#10B981';
  const border = recording ? 'rgba(248,113,113,0.55)' : 'rgba(52,211,153,0.55)';

  return (
    <View
      style={{ width: size * 1.6, height: size * 1.6, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
          },
          ringStyle,
        ]}
      />
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withSpring(0.93, { damping: 18, stiffness: 240 });
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, { damping: 14, stiffness: 180 });
        }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bg,
            borderWidth: 4,
            borderColor: border,
          },
          buttonStyle,
        ]}
      >
        <Ionicons
          name={recording ? 'stop' : 'mic'}
          size={Math.round(size * 0.38)}
          color="#FFFFFF"
        />
      </AnimatedPressable>
    </View>
  );
}
