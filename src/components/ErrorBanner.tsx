import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type ErrorBannerProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  dismissLabel?: string;
};

export function ErrorBanner({
  title,
  message,
  onRetry,
  onDismiss,
  retryLabel = 'Retry',
  dismissLabel = 'Dismiss',
}: ErrorBannerProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      className="overflow-hidden rounded-2xl border border-red-400/30 bg-red-500/10 p-4"
    >
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-500/20">
          <Ionicons name="alert-circle" size={18} color="#FCA5A5" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-red-100">{title}</Text>
          {message ? (
            <Text className="mt-1 text-xs leading-5 text-red-100/80">
              {message}
            </Text>
          ) : null}
          {(onRetry || onDismiss) && (
            <View className="mt-3 flex-row items-center gap-2">
              {onRetry ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onRetry}
                  className="rounded-xl bg-red-500/20 px-3 py-2 active:opacity-70"
                >
                  <Text className="text-xs font-semibold text-red-100">
                    {retryLabel}
                  </Text>
                </Pressable>
              ) : null}
              {onDismiss ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onDismiss}
                  className="rounded-xl border border-white/10 px-3 py-2 active:opacity-70"
                >
                  <Text className="text-xs font-semibold text-ink-200">
                    {dismissLabel}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
