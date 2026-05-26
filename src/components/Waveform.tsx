import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type WaveformProps = {
  active: boolean;
  bars?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
  color?: string;
  idleColor?: string;
};

export function Waveform({
  active,
  bars = 28,
  height = 64,
  barWidth = 4,
  gap = 4,
  color = '#34D399',
  idleColor = 'rgba(148,163,184,0.35)',
}: WaveformProps) {
  return (
    <View
      style={{
        height,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
      }}
    >
      {Array.from({ length: bars }, (_, i) => (
        <WaveBar
          key={i}
          index={i}
          active={active}
          height={height}
          barWidth={barWidth}
          color={active ? color : idleColor}
        />
      ))}
    </View>
  );
}

type WaveBarProps = {
  index: number;
  active: boolean;
  height: number;
  barWidth: number;
  color: string;
};

function WaveBar({ index, active, height, barWidth, color }: WaveBarProps) {
  const amp = useSharedValue(0.2);

  useEffect(() => {
    if (active) {
      const up = 240 + ((index * 37) % 220);
      const down = 260 + ((index * 53) % 240);
      const peak = 0.55 + ((index * 17) % 45) / 100;
      const trough = 0.15 + ((index * 23) % 18) / 100;
      amp.value = withRepeat(
        withSequence(
          withTiming(peak, { duration: up, easing: Easing.inOut(Easing.quad) }),
          withTiming(trough, {
            duration: down,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        true,
      );
    } else {
      amp.value = withTiming(0.18, { duration: 220 });
    }
  }, [active, amp, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: Math.max(amp.value * height, barWidth),
  }));

  return (
    <Animated.View
      style={[
        {
          width: barWidth,
          borderRadius: barWidth,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}
