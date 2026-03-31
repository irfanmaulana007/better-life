import { createStackNavigator } from '@react-navigation/stack';
import { ChartsScreen } from '@screens';
import type { ChartsStackParamList } from '@types/navigation';

const Stack = createStackNavigator<ChartsStackParamList>();

export default function ChartsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Charts"
        component={ChartsScreen}
        options={{ title: 'Charts' }}
      />
    </Stack.Navigator>
  );
}
