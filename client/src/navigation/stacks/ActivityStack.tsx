import { createStackNavigator } from '@react-navigation/stack';
import {
  ActivityListScreen,
  ActivityDetailScreen,
  ActivityFormScreen,
} from '@screens';
import type { ActivityStackParamList } from '@types/navigation';

const Stack = createStackNavigator<ActivityStackParamList>();

export default function ActivityStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="ActivityList"
        component={ActivityListScreen}
        options={{ title: 'Activities' }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: 'Activity' }}
      />
      <Stack.Screen
        name="ActivityForm"
        component={ActivityFormScreen}
        options={{ title: 'New Activity' }}
      />
    </Stack.Navigator>
  );
}
