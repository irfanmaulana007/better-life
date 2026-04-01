import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@types/navigation';
import { Icon, type IconName } from '@/components';
import {
  HomeStack,
  MilestoneStack,
  ActivityStack,
  ChartsStack,
  HistoryStack,
} from './stacks';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabBarIcon({
  name,
  color,
  size,
}: {
  name: IconName;
  color: string;
  size: number;
}) {
  return <Icon name={name} size={size} color={color} />;
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
            <TabBarIcon name="target" color={color} size={size} />
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
