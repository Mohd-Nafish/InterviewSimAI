import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Waveform } from './Waveform';

type QuestionCardProps = {
  prompt: string;
  speaking: boolean;
  loading?: boolean;
};

export function QuestionCard({
  prompt,
  speaking,
  loading = false,
}: QuestionCardProps) {
  return (
    <View className="overflow-hidden rounded-3xl border border-white/10">
      <LinearGradient
        colors={['rgba(16,185,129,0.10)', 'rgba(15,23,42,0.55)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5"
      >
        <View className="mb-3 flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-500/20">
            <Ionicons name="sparkles" size={14} color="#34D399" />
          </View>
          <Text className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            AI Interviewer
          </Text>
        </View>

        {loading ? (
          <View className="gap-2">
            <View className="h-4 w-3/4 rounded-md bg-white/10" />
            <View className="h-4 w-2/3 rounded-md bg-white/10" />
            <View className="h-4 w-1/2 rounded-md bg-white/10" />
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(280)}>
            <Text className="text-xl font-semibold leading-7 text-white">
              {prompt}
            </Text>
          </Animated.View>
        )}

        <View className="mt-5 flex-row items-center gap-3">
          <View className="flex-1">
            <Waveform
              active={speaking || loading}
              bars={20}
              height={28}
              barWidth={3}
              gap={3}
              color="#34D399"
              idleColor="rgba(148,163,184,0.30)"
            />
          </View>
          <Text className="text-xs text-ink-400">
            {loading
              ? 'Preparing…'
              : speaking
                ? 'AI is speaking…'
                : 'Ready'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
