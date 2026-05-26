import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { TranscriptEntry } from '../types';

type TranscriptPanelProps = {
  entries: TranscriptEntry[];
  transcribing?: boolean;
  partial?: string;
  maxHeight?: number;
};

export function TranscriptPanel({
  entries,
  transcribing = false,
  partial,
  maxHeight = 180,
}: TranscriptPanelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isEmpty = entries.length === 0 && !partial;

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [entries.length, partial]);

  return (
    <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="chatbox-ellipses-outline" size={14} color="#94A3B8" />
          <Text className="text-xs font-semibold uppercase tracking-wider text-ink-200">
            Live Transcript
          </Text>
        </View>
        {transcribing ? <TypingDots /> : null}
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ maxHeight }}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <Text className="text-sm leading-5 text-ink-400">
            Your spoken answer will appear here as you record.
          </Text>
        ) : (
          <>
            {entries.map((entry) => (
              <TranscriptBubble key={entry.id} entry={entry} />
            ))}
            {partial ? (
              <TranscriptBubble
                entry={{
                  id: 'partial',
                  role: 'candidate',
                  text: partial,
                  questionId: '',
                  createdAt: Date.now(),
                }}
                partial
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TranscriptBubble({
  entry,
  partial = false,
}: {
  entry: TranscriptEntry;
  partial?: boolean;
}) {
  const isCandidate = entry.role === 'candidate';
  return (
    <View
      className={`max-w-[90%] rounded-2xl px-3 py-2 ${
        isCandidate
          ? 'self-end bg-brand-500/15'
          : 'self-start bg-white/5'
      }`}
    >
      <Text
        className={`text-xs uppercase tracking-wider ${
          isCandidate ? 'text-brand-300' : 'text-ink-400'
        }`}
      >
        {isCandidate ? 'You' : 'AI'}
      </Text>
      <Text
        className={`mt-1 text-sm leading-5 ${
          partial ? 'text-ink-200/80 italic' : 'text-white'
        }`}
      >
        {entry.text}
        {partial ? '…' : ''}
      </Text>
    </View>
  );
}

function TypingDots() {
  return (
    <View className="flex-row items-center gap-1">
      <Dot delay={0} />
      <Dot delay={140} />
      <Dot delay={280} />
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 480, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 5,
          height: 5,
          borderRadius: 5,
          backgroundColor: '#34D399',
          marginLeft: delay > 0 ? 2 : 0,
        },
        style,
      ]}
    />
  );
}
