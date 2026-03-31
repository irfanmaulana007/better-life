import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@types/navigation';
import {
  HomeStack,
  MilestoneStack,
  ActivityStack,
  ChartsStack,
  HistoryStack,
} from './stacks';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple text-based icon component (can be replaced with actual icons later)
function TabBarIcon({
  name,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  const icons: Record<string, string> = {
    home: '🏠',
    flag: '🎯',
    list: '📋',
    chart: '📊',
    clock: '🕒',
  };

  return (
    <Text style={{ fontSize: size - 4 }}>
      {icons[name] || '○'}
    </Text>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MilestonesTab"
        component={MilestoneStack}
        options={{
          tabBarLabel: 'Milestones',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="flag" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ActivitiesTab"
        component={ActivityStack}
        options={{
          tabBarLabel: 'Activities',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="list" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ChartsTab"
        component={ChartsStack}
        options={{
          tabBarLabel: 'Charts',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="chart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStack}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="clock" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
