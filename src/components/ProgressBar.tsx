import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type ProgressBarProps = {
  ratio: number;
  height?: number;
  color?: string;
  trackColor?: string;
};

export function ProgressBar({
  ratio,
  height = 4,
  color = '#10B981',
  trackColor = 'rgba(148,163,184,0.18)',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const width = useSharedValue(clamped);

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 400 });
  }, [clamped, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: height,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
