import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedScreen } from '../components/FixedScreen';
import { GradientBackground } from '../components/GradientBackground';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatElapsed, useInterviewStore } from '../store/interviewStore';
import type { InterviewSession, RootStackScreenProps } from '../types';
import {
  getScoreTone,
  SCORE_GRADIENT,
  SCORE_LABEL,
  SCORE_RING,
  SCORE_RING_GLOW,
  SCORE_TAGLINE,
  SCORE_TEXT,
  type ScoreTone,
} from '../utils/score';

export function FeedbackScreen({
  route,
  navigation,
}: RootStackScreenProps<'Feedback'>) {
  const insets = useSafeAreaInsets();
  const { sessionId } = route.params;

  const session = useInterviewStore((s) =>
    s.history.find((h) => h.id === sessionId),
  );

  const feedback = session?.feedback;
  const overallScore = feedback?.score ?? session?.score ?? null;
  const tone: ScoreTone | null =
    overallScore != null ? getScoreTone(overallScore) : null;

  if (!session) {
    return (
      <GradientBackground>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <Ionicons name="document-text-outline" size={36} color="#94A3B8" />
          <Text className="mt-4 text-base font-semibold text-white">
            Session not found
          </Text>
          <Text className="mt-2 text-center text-sm text-ink-400">
            We couldn’t find this interview in your history.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.popToTop()}
            className="mt-6 rounded-2xl bg-brand-500 px-5 py-3 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">
              Back to home
            </Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <FixedScreen
        header={
          <ScreenHeader
            title="Interview Feedback"
            subtitle={`${session.categoryLabel} · ${formatElapsed(session.durationMs)}`}
            onBack={() => navigation.popToTop()}
          />
        }
      >
        {overallScore != null && tone ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <ScoreRing score={overallScore} tone={tone} />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="items-center rounded-3xl border border-white/10 bg-white/[0.03] p-6"
          >
            <Ionicons name="time-outline" size={28} color="#94A3B8" />
            <Text className="mt-3 text-base font-semibold text-white">
              Feedback unavailable
            </Text>
            <Text className="mt-1 text-center text-xs text-ink-400">
              The AI didn’t return a score for this session.
            </Text>
          </Animated.View>
        )}

        {feedback?.subscores ? (
          <Animated.View entering={FadeInUp.delay(120).duration(450)}>
            <SubscoresCard subscores={feedback.subscores} />
          </Animated.View>
        ) : null}

        {feedback?.summary ? (
          <Animated.View entering={FadeInUp.delay(200).duration(450)}>
            <SectionCard title="Summary" icon="sparkles">
              <Text style={styles.bodyText}>
                {feedback.summary}
              </Text>
            </SectionCard>
          </Animated.View>
        ) : null}

        {feedback?.strengths && feedback.strengths.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(260).duration(450)}>
            <SectionCard title="Strengths" icon="checkmark-circle" accent="good">
              <BulletList items={feedback.strengths} accent="good" />
            </SectionCard>
          </Animated.View>
        ) : null}

        {feedback?.improvements && feedback.improvements.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(320).duration(450)}>
            <SectionCard
              title="Areas to improve"
              icon="trending-up"
              accent="warning"
            >
              <BulletList items={feedback.improvements} accent="warning" />
            </SectionCard>
          </Animated.View>
        ) : null}

        <Animated.View
          entering={FadeInUp.delay(380).duration(450)}
          className="mt-2 flex-row gap-3"
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.replace('Interview', {
                topicId: session.categoryId,
                topicLabel: session.categoryLabel,
              });
            }}
            className="flex-1 items-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 active:opacity-70"
          >
            <Text style={styles.secondaryButtonText}>Try again</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.popToTop()}
            className="flex-1 items-center rounded-2xl bg-brand-500 px-5 py-4 active:opacity-80"
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </Animated.View>
      </FixedScreen>
    </GradientBackground>
  );
}

type ScoreRingProps = { score: number; tone: ScoreTone };

function ScoreRing({ score, tone }: ScoreRingProps) {
  const gradient = SCORE_GRADIENT[tone];
  const accent = SCORE_RING[tone];
  const glow = SCORE_RING_GLOW[tone];

  return (
    <View className="items-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <View
        style={{
          width: 168,
          height: 168,
          borderRadius: 84,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: accent,
          shadowOpacity: 0.55,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            width: 168,
            height: 168,
            borderRadius: 84,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 152,
            height: 152,
            borderRadius: 76,
            backgroundColor: '#0A0E1A',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 152,
            height: 152,
            borderRadius: 76,
            backgroundColor: glow,
            opacity: 0.35,
          }}
        />
        <Text
          style={{ color: '#FFFFFF', fontSize: 64, fontWeight: '800', lineHeight: 72 }}
        >
          {score}
        </Text>
        <Text style={styles.scoreCaption}>
          out of 100
        </Text>
      </View>
      <View className="mt-5 flex-row items-center gap-2">
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 8,
            backgroundColor: accent,
          }}
        />
        <Text style={styles.scoreTagline}>
          {SCORE_TAGLINE[tone]}
        </Text>
      </View>
    </View>
  );
}

function SubscoresCard({
  subscores,
}: {
  subscores: NonNullable<InterviewSession['feedback']>['subscores'];
}) {
  if (!subscores) return null;
  const rows: Array<{ label: string; value: number }> = [
    { label: 'Technical knowledge', value: subscores.technical },
    { label: 'Communication', value: subscores.communication },
    { label: 'Confidence', value: subscores.confidence },
  ];
  return (
    <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <Text style={styles.sectionEyebrow}>
        Scores breakdown
      </Text>
      <View className="gap-4">
        {rows.map((row) => {
          const rowTone = getScoreTone(row.value);
          return (
            <View key={row.label}>
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center gap-2">
                  <Text style={styles.subscoreLabel}>
                    {row.label}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: `${SCORE_RING[rowTone]}22`,
                    }}
                  >
                    <Text
                      style={{
                        color: SCORE_TEXT[rowTone],
                        fontSize: 10,
                        fontWeight: '600',
                        letterSpacing: 0.4,
                      }}
                    >
                      {SCORE_LABEL[rowTone].toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: SCORE_TEXT[rowTone],
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  {row.value}
                  <Text style={styles.scoreSuffix}>/100</Text>
                </Text>
              </View>
              <ProgressBar
                ratio={row.value / 100}
                color={SCORE_RING[rowTone]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

type SectionCardProps = {
  title: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
  accent?: 'good' | 'warning' | 'neutral';
  children: React.ReactNode;
};

function SectionCard({ title, icon, accent = 'neutral', children }: SectionCardProps) {
  const accentBg =
    accent === 'good'
      ? 'rgba(16,185,129,0.14)'
      : accent === 'warning'
        ? 'rgba(245,158,11,0.14)'
        : 'rgba(148,163,184,0.14)';
  const accentColor =
    accent === 'good'
      ? '#34D399'
      : accent === 'warning'
        ? '#FBBF24'
        : '#CBD5E1';
  return (
    <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <LinearGradient
        colors={[accentBg, 'rgba(15,23,42,0.0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="mb-3 flex-row items-center gap-2">
          <Ionicons name={icon} size={16} color={accentColor} />
          <Text style={styles.sectionTitle}>
            {title}
          </Text>
        </View>
        {children}
      </LinearGradient>
    </View>
  );
}

type BulletAccent = 'good' | 'warning';

function BulletList({
  items,
  accent,
}: {
  items: string[];
  accent: BulletAccent;
}) {
  const dotColor = accent === 'good' ? '#34D399' : '#FBBF24';
  return (
    <View className="gap-2.5">
      {items.map((item, idx) => (
        <View key={`${item.slice(0, 12)}-${idx}`} className="flex-row gap-3">
          <View
            style={[
              styles.bulletDot,
              { backgroundColor: dotColor },
            ]}
          />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 24,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginTop: 9,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionEyebrow: {
    color: '#AAB7C8',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  subscoreLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  scoreSuffix: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  scoreCaption: {
    marginTop: 4,
    color: '#AAB7C8',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreTagline: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
