import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from './RootNavigator';

// Custom theme for the app
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E5E5EA',
    notification: '#FF3B30',
  },
};

export default function Navigation() {
  return (
    <NavigationContainer theme={AppTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export { RootNavigator };
