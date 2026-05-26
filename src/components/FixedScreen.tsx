import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FIXED_HEADER_HEIGHT,
  getScreenBottomPadding,
  getScreenTopPadding,
} from '../constants/layout';

type FixedScreenProps = {
  header: ReactNode;
  children: ReactNode;
  horizontalPadding?: number;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  gap?: number;
};

export function FixedScreen({
  header,
  children,
  horizontalPadding = 20,
  keyboardShouldPersistTaps,
  gap = 20,
}: FixedScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        {header}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={{
          paddingTop: getScreenTopPadding(insets.top),
          paddingBottom: getScreenBottomPadding(insets.bottom),
          paddingHorizontal: horizontalPadding,
          gap,
        }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: FIXED_HEADER_HEIGHT,
    justifyContent: 'center',
  },
});
