import { createStackNavigator } from '@react-navigation/stack';
import { MilestoneListScreen } from '@screens';
import type { MilestoneStackParamList } from '@types/navigation';

const Stack = createStackNavigator<MilestoneStackParamList>();

export default function MilestoneStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="MilestoneList"
        component={MilestoneListScreen}
        options={{ title: 'Milestones' }}
      />
    </Stack.Navigator>
  );
}
