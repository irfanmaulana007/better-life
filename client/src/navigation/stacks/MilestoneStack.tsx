import { createStackNavigator } from '@react-navigation/stack';
import {
  MilestoneListScreen,
  MilestoneDetailScreen,
  MilestoneFormScreen,
} from '@screens';
import type { MilestoneStackParamList } from '@types/navigation';

const Stack = createStackNavigator<MilestoneStackParamList>();

export default function MilestoneStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="MilestoneList"
        component={MilestoneListScreen}
        options={{ title: 'Milestones' }}
      />
      <Stack.Screen
        name="MilestoneDetail"
        component={MilestoneDetailScreen}
        options={{ title: 'Milestone' }}
      />
      <Stack.Screen
        name="MilestoneForm"
        component={MilestoneFormScreen}
        options={{ title: 'New Milestone' }}
      />
    </Stack.Navigator>
  );
}
