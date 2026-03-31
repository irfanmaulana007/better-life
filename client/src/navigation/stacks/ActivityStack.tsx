import { createStackNavigator } from '@react-navigation/stack';
import { ActivityListScreen } from '@screens';
import type { ActivityStackParamList } from '@types/navigation';

const Stack = createStackNavigator<ActivityStackParamList>();

export default function ActivityStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="ActivityList"
        component={ActivityListScreen}
        options={{ title: 'Activities' }}
      />
    </Stack.Navigator>
  );
}
