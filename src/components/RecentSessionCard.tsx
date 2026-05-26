import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  getScoreTone,
  SCORE_GRADIENT,
  SCORE_RING,
  SCORE_TEXT,
} from '../utils/score';

export type RecentSessionPreview = {
  id: string;
  topicLabel: string;
  score: number;
  durationMinutes: number;
  completedAt: string;
};

type RecentSessionCardProps = {
  session: RecentSessionPreview;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RecentSessionCard({
  session,
  onPress,
}: RecentSessionCardProps) {
  const scale = useSharedValue(1);
  const tone = getScoreTone(session.score);
  const scoreGradient = SCORE_GRADIENT[tone];
  const scoreColor = SCORE_TEXT[tone];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 18, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      }}
      style={animatedStyle}
      className="overflow-hidden rounded-3xl border border-white/10"
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(15,23,42,0.0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 14,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={[...scoreGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              width: 56,
              height: 56,
              borderRadius: 18,
              opacity: 0.18,
            }}
          />
          <View
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: `${SCORE_RING[tone]}55`,
            }}
          />
          <Text
            style={{
              color: scoreColor,
              fontSize: 22,
              fontWeight: '800',
              lineHeight: 26,
            }}
          >
            {session.score}
          </Text>
          <Text className="text-[9px] font-semibold tracking-wider text-ink-400">
            / 100
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-semibold uppercase tracking-[2px] text-brand-300">
            Last session
          </Text>
          <Text className="mt-0.5 text-base font-semibold text-white">
            {session.topicLabel}
          </Text>
          <Text
            style={{ color: '#AAB7C8', fontSize: 12, marginTop: 2 }}
          >
            {session.durationMinutes} min · {session.completedAt}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </LinearGradient>
    </AnimatedPressable>
  );
}
