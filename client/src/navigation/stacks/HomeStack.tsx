import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '@screens';
import type { HomeStackParamList } from '@types/navigation';

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Today' }}
      />
    </Stack.Navigator>
  );
}
