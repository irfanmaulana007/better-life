import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen, LogSessionScreen } from '@screens';
import type { HomeStackParamList } from '@types/navigation';

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Today' }}
      />
      <Stack.Screen
        name="LogSession"
        component={LogSessionScreen}
        options={{ title: 'Log Session' }}
      />
    </Stack.Navigator>
  );
}
