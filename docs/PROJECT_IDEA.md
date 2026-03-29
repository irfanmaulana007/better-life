# Product Requirements Document: Argopuro Preparation Tracker

**Project Name:** Argopuro Prep Tracker  
**Platform:** iOS (React Native)  
**Audience:** Personal Use Only  
**Status:** Pre-Development

---

## 1. Product Overview

### Vision
A mobile habit and goal tracking application designed to prepare the user physically for hiking Mount Argopuro. The app enables structured planning of fitness activities (running, gym, leg day) with flexible goal-setting, progress tracking, and historical visualization to maintain motivation throughout the preparation period.

### Objective
- Enable structured daily/weekly fitness planning tied to a specific training milestone
- Track completion and actual performance metrics for each activity session
- Visualize progress through charts and historical data
- Maintain motivation through streak tracking and progress insights

### Scope
- **In-Scope**: Milestone/activity management, goal setting, daily tracking, charts/graphs, historical data
- **Out-of-Scope**: Social sharing, wearable integration, app store publishing, previous fitness data import

---

## 2. Core Features

### 2.1 Milestone Management
- **Create Milestones**: User can create a milestone (e.g., "Argopuro Mount Preparation")
- **Set Timeline**: Each milestone has a mandatory start date and optional end date
- **Milestone Overview**: Display milestone name, timeline (weeks remaining), and overall progress
- **Edit/Delete**: Modify or remove milestones as needed

### 2.2 Activity Management
- **Create Activities**: User can create activities under a milestone (e.g., Running, Gym, Leg Day)
- **Flexible Units**: Support multiple unit types per activity:
  - Distance: kilometers (km)
  - Time: hours and minutes (HH:MM)
  - Reps & Sets: for gym/workout activities
  - Single counter: for one-off tracking (e.g., sessions completed)
- **Activity Properties**:
  - Name (e.g., "Morning Run")
  - Unit type and unit name (e.g., "distance - km")
  - Associated milestone
  - Schedule: Days of the week when activity occurs (Mon-Sun checklist)
  - Optional target goal (e.g., "5km per session")

### 2.3 Daily Goal Tracking
- **Daily View**: Display all activities scheduled for the day
- **Quick Logging**: Mark activity as done with one tap
- **Actual Result Input**: Optionally log actual performance when marking complete:
  - For distance: input actual km achieved
  - For time: input actual time spent
  - For reps/sets: input actual reps/sets completed
- **Optional Goals**: Activities may or may not have preset targets
- **Status Indicators**: Show completed, pending, or skipped for each activity
- **Progress Bar**: Visual indication of daily completion rate

### 2.4 Historical Tracking & Insights
- **Activity History**: View all past sessions for an activity with timestamps and actual results
- **Progress Charts**:
  - **Volume Over Time**: Total distance/time/reps per week or month
  - **Performance Trend**: Average performance per activity (e.g., average running distance per session)
  - **Completion Rate**: Percentage of scheduled activities completed per week
  - **Streak Tracking**: Current consecutive days/weeks of activity completion
- **Weekly Summary**: Overview of weekly completions vs. scheduled activities
- **Filters**: View history by activity, date range, or milestone

### 2.5 Notifications & Reminders (Optional)
- **Daily Reminder**: Gentle notification for scheduled activities (configurable)
- **Achievement Badges**: Celebrate milestones (e.g., "10 gym sessions completed")

---

## 3. User Stories

### Story 1: Create Training Plan
**As a** user preparing for Argopuro  
**I want to** create a milestone with start/end date and add activities (running, gym, leg day)  
**So that** I have a structured training plan to follow

**Acceptance Criteria:**
- [ ] User can create a milestone with name, start date, and optional end date
- [ ] User can add multiple activities under the milestone
- [ ] User can set day-of-week repetition for each activity
- [ ] User can set an optional daily target goal for each activity

### Story 2: Log Daily Progress
**As a** user completing a training session  
**I want to** quickly mark activities as done and log actual performance metrics  
**So that** I can track my real progress vs. planned goals

**Acceptance Criteria:**
- [ ] User can see all activities scheduled for today
- [ ] User can tap to mark an activity as completed
- [ ] User can optionally input actual results (distance, time, reps)
- [ ] Results are saved with timestamp

### Story 3: View Progress & Trends
**As a** motivated athlete  
**I want to** see charts showing my progress over time  
**So that** I can stay motivated and identify improvement areas

**Acceptance Criteria:**
- [ ] User can view weekly/monthly volume charts for each activity
- [ ] User can see streak information (current consecutive days/weeks)
- [ ] User can view completion rate (% of scheduled activities done)
- [ ] User can see performance trends (e.g., increasing running distance)

### Story 4: Manage History
**As a** a user tracking long-term progress  
**I want to** view and filter historical data for any activity  
**So that** I can analyze my training progression

**Acceptance Criteria:**
- [ ] User can view all past sessions for an activity
- [ ] User can filter by date range or activity type
- [ ] Each session shows date, actual result, and target (if any)

---

## 4. Data Model

### Database Schema

#### Milestones Table
```
id (PK)
name (string)
startDate (date)
endDate (date, nullable)
createdAt (timestamp)
updatedAt (timestamp)
```

#### Activities Table
```
id (PK)
milestoneId (FK)
name (string)
unitType (enum: distance, time, reps, counter)
unitName (string) // e.g., "km", "HH:MM", "reps", "sets"
targetGoal (number, nullable) // e.g., 5 (for 5km)
scheduleDays (array of integers) // 0-6 representing Mon-Sun
createdAt (timestamp)
updatedAt (timestamp)
```

#### Sessions Table (Tracking History)
```
id (PK)
activityId (FK)
date (date)
isCompleted (boolean)
actualResult (number, nullable) // e.g., 4.2 (km), 45 (minutes), 10 (reps)
targetGoal (number, nullable) // snapshot of activity goal at time of logging
notes (string, nullable)
createdAt (timestamp)
updatedAt (timestamp)
```

---

## 5. Key Screens & User Interface

### 5.1 Home / Dashboard Screen
- **Header**: Current milestone name & countdown (weeks remaining)
- **Today's Activities**: List of scheduled activities for today
  - Activity name, target goal, status (pending/done)
  - Quick action: tap to mark complete
- **Quick Stats**: 
  - Today's completion rate
  - Current streak (days/weeks)
- **Navigation**: Tabs to access Milestones, Activities, History, Charts

### 5.2 Milestone Screen
- **List of Milestones**: Card view showing:
  - Milestone name
  - Start & end dates
  - Days remaining
  - Associated activity count
- **Actions**: Create new milestone, edit, delete
- **Tap Milestone**: Navigate to milestone detail with all associated activities

### 5.3 Activity Management Screen
- **List Activities**: For selected milestone
  - Activity name, unit type, target goal, scheduled days
- **Create Activity**: Form to add new activity
- **Edit Activity**: Modify name, unit type, goal, schedule days
- **Delete Activity**: Remove activity

### 5.4 Daily Logging Screen
- **Date Selector**: View any day (default: today)
- **Scheduled Activities for Date**: List showing:
  - Activity name
  - Target goal (if set)
  - Status: pending / completed
  - Actual result (if logged)
- **Log Session**:
  - Tap activity → open modal
  - Toggle "Mark as done"
  - Input field: "Actual Result" (number)
  - Optional notes field
  - Save button

### 5.5 Charts & Analytics Screen
- **Tab View**: Switch between different chart types
  - **Volume Over Time**: Bar or line chart (weekly/monthly totals)
  - **Completion Rate**: Percentage of scheduled activities completed per week
  - **Performance Trend**: Line chart showing average performance per session
  - **Activity Comparison**: Side-by-side comparison of activities
- **Filters**: By activity, by date range
- **Streak Counter**: Prominent display of current streak

### 5.6 History Screen
- **Activity Selector**: Dropdown to filter by activity
- **Date Range Picker**: Filter by date range
- **Session List**: Chronological list of all sessions
  - Date, target goal, actual result, completion status
  - Tap to edit or delete session
- **Search/Filter**: Quick search by activity name or date

---

## 6. Technical Requirements

### Platform
- **Framework**: React Native (iOS)
- **Target**: iPhone (iOS 14+)
- **State Management**: Redux, Context API, or similar
- **Local Storage**: AsyncStorage or SQLite for offline-first data persistence
- **Charts Library**: React Native Chart Kit, Victory Native, or similar

### Performance
- Smooth animations and transitions
- Fast load times (< 2 seconds for home screen)
- Minimal battery drain
- Responsive UI during data operations

### Security & Privacy
- All data stored locally on device (no cloud sync)
- No user authentication required (personal use)
- Data accessible only from this app

---

## 7. User Flow

```
1. User launches app
   ↓
2. No milestones? Show empty state → User creates first milestone
   ↓
3. Dashboard shows today's activities
   ↓
4. User taps activity → Modal opens to log result
   ↓
5. User enters actual result & marks complete
   ↓
6. Session saved to history
   ↓
7. User can view charts anytime to see progress
   ↓
8. As time progresses, data accumulates for historical trends
```

---

## 8. Success Metrics

- **Feature Adoption**: User successfully creates milestone and logs daily activities
- **Engagement**: User logs results on 80%+ of scheduled activities
- **Data Quality**: User inputs actual results (not just marks complete)
- **Motivation**: User views charts/history at least 2x per week
- **Retention**: User continues app usage for entire training period until Argopuro hike

---

## 9. Future Enhancements

### Phase 2
- **Notifications**: Daily activity reminders
- **Recovery Tracking**: Log rest days, fatigue levels, stretching sessions
- **Export Data**: Share training summary as image/PDF
- **Offline Sync**: Cloud backup option (Google Drive, iCloud)

### Phase 3
- **Wearable Integration**: Auto-log distance/steps from Health app
- **AI Insights**: Recommendations based on performance trends
- **Post-Hike Analytics**: Comparison of training metrics vs. actual hike performance
- **Community**: Optional sharing of achievements with friends

---

## 10. Development Priorities

### MVP (Minimum Viable Product)
1. Milestone CRUD operations
2. Activity CRUD operations with flexible units
3. Daily activity logging with actual results
4. Basic history view
5. Simple charts (volume, completion rate)
6. Local data persistence

### Phase 2
1. Advanced charts (trends, performance analysis)
2. Streak tracking & badges
3. Notifications & reminders
4. Enhanced UI/UX polish

### Phase 3
1. Data export
2. Wearable integration
3. Advanced analytics & recommendations

---

## 11. Assumptions & Constraints

### Assumptions
- User will consistently use the app to log activities
- User has clear training plan in mind
- No social/competitive element needed
- iOS-only initially

### Constraints
- Local storage only (no backend server)
- Personal use scope (no user authentication)
- Must work offline
- Target: Argopuro hike date is ~1 month away (set deadline)

---

## 12. Acceptance Criteria Summary

**App is considered "complete" when:**
- [ ] User can create and manage milestones with date ranges
- [ ] User can create activities with flexible unit types and day-of-week scheduling
- [ ] User can log daily results with actual performance metrics
- [ ] User can view activity history with filters
- [ ] User can view charts showing volume trends, completion rates, and performance trends
- [ ] All data persists locally on device
- [ ] App is intuitive and requires minimal onboarding
- [ ] User successfully tracks activities for at least 2 weeks with real data

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-30  
**Status:** Ready for Development Planning