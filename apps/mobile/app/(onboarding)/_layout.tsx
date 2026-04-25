import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0c1a0d' },
        animation: 'slide_from_right',
      }}
    />
  );
}
