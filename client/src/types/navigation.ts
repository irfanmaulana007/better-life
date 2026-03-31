import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

// Root Stack (contains the Tab Navigator)
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  MilestonesTab: NavigatorScreenParams<MilestoneStackParamList>;
  ActivitiesTab: NavigatorScreenParams<ActivityStackParamList>;
  ChartsTab: NavigatorScreenParams<ChartsStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
};

// Home Stack
export type HomeStackParamList = {
  Home: undefined;
  LogSession: { activityLocalId: string; date: string };
};

// Milestone Stack
export type MilestoneStackParamList = {
  MilestoneList: undefined;
  MilestoneDetail: { localId: string };
  MilestoneForm: { localId?: string }; // undefined = create, defined = edit
};

// Activity Stack
export type ActivityStackParamList = {
  ActivityList: { milestoneLocalId?: string };
  ActivityDetail: { localId: string };
  ActivityForm: { localId?: string; milestoneLocalId?: string };
};

// Charts Stack
export type ChartsStackParamList = {
  Charts: undefined;
};

// History Stack
export type HistoryStackParamList = {
  History: undefined;
  SessionDetail: { localId: string };
};

// Screen Props types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    StackScreenProps<HomeStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type MilestoneStackScreenProps<T extends keyof MilestoneStackParamList> =
  CompositeScreenProps<
    StackScreenProps<MilestoneStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type ActivityStackScreenProps<T extends keyof ActivityStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ActivityStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type ChartsStackScreenProps<T extends keyof ChartsStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ChartsStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type HistoryStackScreenProps<T extends keyof HistoryStackParamList> =
  CompositeScreenProps<
    StackScreenProps<HistoryStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

// Declare the types for useNavigation hook
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
