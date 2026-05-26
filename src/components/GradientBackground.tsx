import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gradients } from '../constants/theme';

type GradientBackgroundProps = {
  children: ReactNode;
};

export function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill} className="flex-1 bg-ink-950">
      <LinearGradient
        colors={[...gradients.background]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.glowWrap]}
      >
        <View style={[styles.glow, styles.glowOne]} />
        <View style={[styles.glow, styles.glowTwo]} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 320,
  },
  glowOne: {
    top: -160,
    left: -140,
    backgroundColor: '#10B981',
    opacity: 0.16,
  },
  glowTwo: {
    bottom: -160,
    right: -160,
    backgroundColor: '#22D3EE',
    opacity: 0.10,
  },
});
