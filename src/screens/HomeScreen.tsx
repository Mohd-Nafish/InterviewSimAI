import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { CategoryCard } from '../components/CategoryCard';
import { FixedScreen } from '../components/FixedScreen';
import { GradientBackground } from '../components/GradientBackground';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  RecentSessionCard,
  type RecentSessionPreview,
} from '../components/RecentSessionCard';
import { useInterviewStore } from '../store/interviewStore';
import type { RootStackScreenProps } from '../types';

const formatRelativeDate = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

type Category = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const CATEGORIES: Category[] = [
  {
    id: 'react-native',
    label: 'React Native',
    description: 'Hooks · native modules',
    icon: 'logo-react',
  },
  {
    id: 'hr',
    label: 'HR',
    description: 'Behavioral · culture',
    icon: 'people-outline',
  },
  {
    id: 'dsa',
    label: 'DSA',
    description: 'Arrays · trees · graphs',
    icon: 'git-network-outline',
  },
  {
    id: 'system-design',
    label: 'System Design',
    description: 'Scale · trade-offs',
    icon: 'layers-outline',
  },
];

export function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const [selectedId, setSelectedId] = useState<string>(CATEGORIES[0]!.id);
  const latestSession = useInterviewStore((s) => s.history[0]);

  const recentPreview = useMemo<RecentSessionPreview | null>(() => {
    if (!latestSession) return null;
    return {
      id: latestSession.id,
      topicLabel: latestSession.categoryLabel,
      score: latestSession.feedback?.score ?? latestSession.score ?? 0,
      durationMinutes: Math.max(1, Math.round(latestSession.durationMs / 60000)),
      completedAt: formatRelativeDate(latestSession.endedAt ?? latestSession.startedAt),
    };
  }, [latestSession]);

  const selected = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedId) ?? CATEGORIES[0]!,
    [selectedId],
  );

  const onStart = () => {
    navigation.navigate('Interview', {
      topicId: selected.id,
      topicLabel: selected.label,
    });
  };

  return (
    <GradientBackground>
      <FixedScreen
        horizontalPadding={isCompact ? 16 : 20}
        header={
          <Animated.View entering={FadeInDown.duration(500).springify()}>
            <View className="flex-row items-center">
              <View className="flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-2xl bg-brand-500/15">
                  <Ionicons name="sparkles" size={18} color="#34D399" />
                </View>
                <Text className="text-sm font-medium tracking-wider text-ink-200">
                  INTERVIEWSIM AI
                </Text>
              </View>
            </View>
          </Animated.View>
        }
      >
        <Animated.View
          entering={FadeInDown.delay(80).duration(550).springify()}
        >
          <Text className="text-[34px] font-bold leading-[40px] text-white">
            Train smarter.{'\n'}
            <Text className="text-emerald-glow">Interview sharper.</Text>
          </Text>
          <Text className="mt-3 text-base leading-6 text-ink-200/90">
            Pick a track and run a realistic mock interview with instant AI
            feedback.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(160).duration(500)}
          className="mt-8"
        >
          <View className="mb-3 flex-row items-end justify-between">
            <Text className="text-base font-semibold text-white">
              Choose a category
            </Text>
            <Text className="text-xs text-ink-400">{CATEGORIES.length} tracks</Text>
          </View>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {CATEGORIES.map((category, index) => (
              <Animated.View
                key={category.id}
                entering={FadeInUp.delay(180 + index * 70).duration(420)}
                style={{ width: '48%' }}
              >
                <CategoryCard
                  id={category.id}
                  label={category.label}
                  description={category.description}
                  icon={category.icon}
                  selected={selectedId === category.id}
                  onPress={() => setSelectedId(category.id)}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(480).duration(500)}
          className="mt-8"
        >
          <PrimaryButton
            label={`Start ${selected.label} interview`}
            onPress={onStart}
            icon="play"
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(560).duration(500)}
          className="mt-8"
        >
          <Text className="mb-3 text-base font-semibold text-white">
            Recent session
          </Text>
          {recentPreview ? (
            <RecentSessionCard
              session={recentPreview}
              onPress={() =>
                navigation.navigate('Feedback', { sessionId: recentPreview.id })
              }
            />
          ) : (
            <View className="items-center rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15">
                <Ionicons name="sparkles-outline" size={20} color="#34D399" />
              </View>
              <Text className="mt-3 text-sm font-semibold text-white">
                No sessions yet
              </Text>
              <Text className="mt-1 text-center text-xs text-ink-400">
                Finish your first mock interview to see it here.
              </Text>
            </View>
          )}
        </Animated.View>
      </FixedScreen>
    </GradientBackground>
  );
}
