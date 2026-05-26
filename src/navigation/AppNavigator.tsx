import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';

import { darkColors, darkNavigationTheme, lightColors, lightNavigationTheme } from '../constants/theme';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { InterviewScreen } from '../screens/InterviewScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? darkNavigationTheme : lightNavigationTheme;
  const colors = isDark ? darkColors : lightColors;

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontWeight: '600', color: colors.text },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Interview"
          component={InterviewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
