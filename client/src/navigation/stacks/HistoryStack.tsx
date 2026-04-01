import { createStackNavigator } from '@react-navigation/stack';
import { HistoryScreen, SessionDetailScreen } from '@screens';
import type { HistoryStackParamList } from '@types/navigation';

const Stack = createStackNavigator<HistoryStackParamList>();

export default function HistoryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: 'Session' }}
      />
    </Stack.Navigator>
  );
}
