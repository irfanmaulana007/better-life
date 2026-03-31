import { createStackNavigator } from '@react-navigation/stack';
import { HistoryScreen } from '@screens';
import type { HistoryStackParamList } from '@types/navigation';

const Stack = createStackNavigator<HistoryStackParamList>();

export default function HistoryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
    </Stack.Navigator>
  );
}
