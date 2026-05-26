import type { ReactNode } from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type ContainerProps = ViewProps & {
  children: ReactNode;
  edges?: ReadonlyArray<Edge>;
  scroll?: boolean;
  padded?: boolean;
  className?: string;
};

const DEFAULT_EDGES: ReadonlyArray<Edge> = ['top', 'left', 'right'];

export function Container({
  children,
  edges = DEFAULT_EDGES,
  scroll = false,
  padded = true,
  className,
  ...rest
}: ContainerProps) {
  const innerClasses = [
    'flex-1',
    padded ? 'px-5 pt-4 pb-6' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const Inner = (
    <View className={innerClasses} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      className="flex-1 bg-white dark:bg-zinc-950"
    >
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {Inner}
        </ScrollView>
      ) : (
        Inner
      )}
    </SafeAreaView>
  );
}
