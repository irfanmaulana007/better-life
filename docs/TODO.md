# Development Todo List: BetterLife

## Legend
- [ ] Not started
- [x] Completed
- [~] In progress

---

## Phase 1: Project Setup & Foundation

### 1.1 Monorepo Initialization
- [x] Initialize Git repository at project root
- [x] Create directory structure:
  ```
  betterlife/
  ├── client/
  ├── server/
  └── docs/
  ```
- [x] Create root .gitignore (Node.js + Go + iOS)
- [x] Create root README.md with project overview
- [x] Create Makefile with common commands:
  - `make client-install` - Install client dependencies
  - `make client-start` - Start React Native
  - `make server-start` - Start Go server
  - `make db-up` - Start PostgreSQL
  - `make db-migrate` - Run Sqitch migrations
- [x] Create docker-compose.yml for local PostgreSQL
- [x] Create initial commit

### 1.2 Expo Project Initialization
- [x] Initialize Expo project in client/ directory
- [x] Set up folder structure (src/components, screens, services, types, store, hooks, utils, constants)
- [x] Configure ESLint with TypeScript rules
- [x] Configure Prettier for code formatting
- [x] Add .editorconfig for consistent editor settings
- [x] Configure app.json for Expo
- [x] Configure babel.config.js with path aliases

### 1.3 Install Core Dependencies
- [x] Install Expo SDK and expo-sqlite
- [x] Install React Navigation (`@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/stack`)
- [x] Install navigation peer dependencies (react-native-screens, react-native-safe-area-context, etc.)
- [x] Install Zustand for state management
- [x] Install Victory Native for charts
- [x] Install date-fns for date manipulation
- [x] Install React Hook Form + Zod for form handling
- [x] Install UI library (react-native-paper)
- [x] Install react-native-modal for modal dialogs
- [x] Install axios for HTTP requests
- [x] Install uuid for local ID generation
- [x] Install @react-native-async-storage/async-storage for simple key-value storage
- [x] Install @react-native-community/netinfo for network status detection

### 1.4 Local Database Setup (expo-sqlite)
- [x] Create database service file (`client/src/services/database/index.ts`)
- [x] Implement database initialization function using expo-sqlite
- [x] Create milestones table schema with sync columns:
  ```sql
  local_id, server_id, name, start_date, end_date,
  sync_status, created_at, updated_at, deleted_at
  ```
- [x] Create activities table schema with sync columns:
  ```sql
  local_id, server_id, milestone_local_id, name, unit_type,
  unit_name, target_goal, schedule_days, sync_status,
  created_at, updated_at, deleted_at
  ```
- [x] Create sessions table schema with sync columns:
  ```sql
  local_id, server_id, activity_local_id, date, is_completed,
  actual_result, target_goal, notes, sync_status,
  created_at, updated_at, deleted_at
  ```
- [x] Implement local migration system for schema versioning
- [x] Create TypeScript interfaces for all entities (`client/src/types/entities.ts`)
- [x] Test database creation on app launch

### 1.5 Navigation Setup
- [x] Create bottom tab navigator (Home, Milestones, Activities, Charts, History)
- [x] Create stack navigators for each tab
- [x] Set up navigation types for TypeScript
- [x] Add navigation container with theme
- [x] Test navigation between screens

### 1.6 State Management Setup
- [x] Create Zustand store for milestones
- [x] Create Zustand store for activities
- [x] Create Zustand store for sessions
- [x] Create Zustand store for app settings (selected milestone, last sync time, etc.)
- [x] Create Zustand store for sync status
- [x] Connect stores to database service

---

## Phase 2: Milestone Management (MVP)

### 2.1 Milestone CRUD Operations
- [x] Implement `createMilestone` database function (generates UUID, sets sync_status='pending')
- [x] Implement `getMilestones` database function (excludes soft-deleted)
- [x] Implement `getMilestoneById` database function
- [x] Implement `updateMilestone` database function (updates updated_at, sets sync_status='pending')
- [x] Implement `deleteMilestone` database function (soft delete with deleted_at)
- [x] Implement `getActivitiesCountByMilestone` function

### 2.2 Milestone List Screen
- [x] Create MilestoneListScreen component
- [x] Create MilestoneCard component
- [x] Display milestone name, dates, days remaining
- [x] Display activity count per milestone
- [x] Add FAB button to create new milestone
- [x] Implement pull-to-refresh
- [x] Handle empty state (no milestones)

### 2.3 Create/Edit Milestone Screen
- [x] Create MilestoneFormScreen component
- [x] Add name input field with validation
- [x] Add start date picker
- [x] Add end date picker (optional)
- [x] Implement form validation (name required, dates valid)
- [x] Handle create mode vs edit mode
- [x] Save milestone to database
- [x] Navigate back on success

### 2.4 Milestone Detail Screen
- [x] Create MilestoneDetailScreen component
- [x] Display milestone information
- [x] Show list of associated activities
- [x] Add edit button (navigate to form)
- [x] Add delete button with confirmation dialog
- [x] Calculate and display progress metrics

---

## Phase 3: Activity Management (MVP)

### 3.1 Activity CRUD Operations
- [x] Implement `createActivity` database function
- [x] Implement `getActivitiesByMilestone` database function
- [x] Implement `getActivityById` database function
- [x] Implement `updateActivity` database function
- [x] Implement `deleteActivity` database function (soft delete)
- [x] Implement `getActivitiesByScheduleDay` function (for daily view)

### 3.2 Activity List Screen
- [x] Create ActivityListScreen component
- [x] Create ActivityCard component
- [x] Display activity name, unit type, target
- [x] Display scheduled days as badges (M, T, W, T, F, S, S)
- [x] Add FAB button to create new activity
- [x] Filter activities by selected milestone
- [x] Handle empty state

### 3.3 Create/Edit Activity Screen
- [x] Create ActivityFormScreen component
- [x] Add name input field
- [x] Create unit type selector (distance, time, reps, counter)
- [x] Add unit name input (km, minutes, reps, etc.)
- [x] Add target goal input (optional, numeric)
- [x] Create day-of-week multi-select component
- [x] Add milestone selector (if creating from general screen)
- [x] Implement form validation
- [x] Handle create mode vs edit mode
- [x] Save activity to database

### 3.4 Activity Detail Screen
- [x] Create ActivityDetailScreen component
- [x] Display full activity information
- [x] Show recent sessions for this activity
- [x] Link to full history for this activity
- [x] Add edit/delete actions

---

## Phase 4: Daily Tracking & Dashboard (MVP)

### 4.1 Session CRUD Operations
- [x] Implement `createSession` database function
- [x] Implement `getSessionsByDate` database function
- [x] Implement `getSessionsByActivity` database function
- [x] Implement `getSessionsByDateRange` database function
- [x] Implement `updateSession` database function
- [x] Implement `deleteSession` database function (soft delete)

### 4.2 Dashboard / Home Screen
- [x] Create HomeScreen component
- [x] Create DashboardHeader component (milestone name, countdown)
- [x] Fetch today's scheduled activities
- [x] Create TodayActivityList component
- [x] Create TodayActivityCard component
- [x] Show activity name, target, completion status
- [x] Add quick complete toggle
- [x] Create DailyProgressBar component
- [x] Create StreakCounter component
- [x] Calculate current streak

### 4.3 Session Logging Screen
- [x] Create LogSessionScreen component
- [x] Display activity name and target goal
- [x] Add "Mark as completed" toggle
- [x] Create dynamic input based on unit type:
  - [x] Distance input (numeric, km)
  - [x] Time input (numeric minutes)
  - [x] Reps input (numeric)
  - [x] Counter input (numeric)
- [x] Add optional notes text field
- [x] Implement save logic
- [x] Navigate back on save
- [x] Update UI to reflect new session

### 4.4 Date Navigation
- [x] Create DateSelector component
- [x] Allow navigating to past dates
- [x] Allow navigating to future dates (for planning)
- [x] Fetch activities and sessions for selected date
- [x] Show existing sessions for past dates
- [x] Allow editing past sessions

---

## Phase 5: History Screen (MVP)

### 5.1 History Screen UI
- [x] Create HistoryScreen component
- [x] Create ActivityFilterDropdown component
- [x] Create DateRangePicker component
- [x] Create SessionListItem component
- [x] Display session date, activity, target, actual result
- [x] Show completion status indicator
- [x] Implement pagination support

### 5.2 History Functionality
- [x] Implement filter by activity
- [x] Implement filter by date range
- [x] Implement search by activity name
- [x] Add tap to view session detail
- [x] Add edit session capability
- [x] Add delete session with confirmation
- [x] Handle empty state (no sessions)

---

## Phase 6: Charts & Analytics (MVP)

### 6.1 Chart Data Services
- [x] Create analytics service (`client/src/services/analytics/index.ts`)
- [x] Implement `getVolumeOverTime` function (weekly/monthly totals)
- [x] Implement `getCompletionRate` function (completed/scheduled %)
- [x] Implement `getPerformanceTrend` function (average per session)
- [x] Implement `getStreakData` function

### 6.2 Charts Screen
- [x] Create ChartsScreen component
- [x] Create chart type tab selector
- [x] Create VolumeChart component (custom bar chart)
- [x] Create CompletionRateChart component
- [x] Add activity filter for charts
- [x] Add date range filter for charts
- [x] Create StreakDisplay component (prominent)

### 6.3 Chart Interactivity
- [x] Add touch interaction to charts (show values)
- [x] Implement time range toggle (7 days, 30 days, this month, 3 months)
- [x] Add loading states for chart data
- [x] Handle empty chart states

---

## Phase 7: Go Backend Setup

### 7.1 Project Initialization
- [x] Create server/ directory structure:
  ```
  server/
  ├── cmd/api/
  ├── internal/
  ├── migrations/
  └── pkg/
  ```
- [x] Initialize Go module (`go mod init github.com/betterlife/server`)
- [x] Install Gin framework
- [x] Install PostgreSQL driver (pgx)
- [x] Set up environment configuration (viper)
- [x] Create server/Dockerfile for the API
- [x] Update root docker-compose.yml to include API service

### 7.2 Sqitch Setup & Migrations
- [x] Initialize Sqitch project in server/migrations/
- [x] Configure sqitch.conf with PostgreSQL settings
- [x] Create migration: 001-create-devices
- [x] Create migration: 002-create-milestones
- [x] Create migration: 003-create-activities
- [x] Create migration: 004-create-sessions
- [x] Write revert scripts for all migrations
- [x] Write verify scripts for all migrations

### 7.3 Backend Project Structure
- [x] Create server/cmd/api/main.go (entry point)
- [x] Create server/internal/config (configuration loading)
- [x] Create server/internal/model (data structures)
- [x] Create server/internal/repository (database layer)
- [x] Create server/internal/handler (HTTP handlers)
- [x] Create server/internal/middleware (auth, logging, CORS)
- [x] Create server/pkg/response (standard API responses)

### 7.4 Core API Endpoints
- [x] Implement health check endpoint (GET /health)
- [x] Implement device registration (POST /api/devices - generates token)
- [x] Implement milestones CRUD:
  - [x] POST /api/milestones
  - [x] GET /api/milestones
  - [x] GET /api/milestones/:id
  - [x] PUT /api/milestones/:id
  - [x] DELETE /api/milestones/:id
- [x] Implement activities CRUD:
  - [x] POST /api/activities
  - [x] GET /api/activities
  - [x] GET /api/activities/:id
  - [x] PUT /api/activities/:id
  - [x] DELETE /api/activities/:id
- [x] Implement sessions CRUD:
  - [x] POST /api/sessions
  - [x] GET /api/sessions
  - [x] GET /api/sessions/:id
  - [x] PUT /api/sessions/:id
  - [x] DELETE /api/sessions/:id
- [x] Implement sync endpoints:
  - [x] POST /api/sync/push
  - [x] GET /api/sync/pull

### 7.5 Authentication Middleware
- [x] Create device token middleware
- [x] Validate token on protected routes
- [x] Extract device_token from Authorization header
- [x] Pass device_token to handlers via context

---

## Phase 8: Sync Implementation

### 8.1 Server Sync Endpoints
- [x] Create sync handler (server/internal/handler/sync.go)
- [x] Implement POST /api/sync/push
  - [x] Accept batch of changes (milestones, activities, sessions)
  - [x] Process creates: insert new records, return server_id
  - [x] Process updates: update existing records by local_id
  - [x] Process deletes: set deleted_at timestamp
  - [x] Return sync results with server_id mappings
- [x] Implement GET /api/sync/pull?since=timestamp
  - [x] Return all records updated since timestamp
  - [x] Include soft-deleted records (for client to delete locally)

### 8.2 Client Sync Service
- [x] Create sync service (`client/src/services/sync/index.ts`)
- [x] Implement network status detection (NetInfo)
- [x] Implement `getPendingChanges` function (query sync_status='pending')
- [x] Implement `pushChanges` function
  - [x] Batch pending changes by entity type
  - [x] Send to POST /api/sync/push
  - [x] Update local records with server_id
  - [x] Set sync_status='synced'
- [x] Implement `pullChanges` function
  - [x] Call GET /api/sync/pull?since=lastSyncTime
  - [x] Merge server changes into local SQLite
  - [x] Handle conflicts (server wins by timestamp)
  - [x] Update lastSyncTime
- [x] Implement `fullSync` function (push then pull)

### 8.3 Sync Triggers
- [x] Trigger sync on app foreground (AppState listener)
- [x] Trigger sync on pull-to-refresh
- [x] Trigger sync after successful data modification (debounced)
- [x] Add manual sync via SyncStatusIndicator tap

### 8.4 Sync UI Feedback
- [x] Create SyncStatusIndicator component
- [x] Show "Syncing..." during sync
- [x] Show "Last synced: X minutes ago"
- [x] Show "Offline" when no network
- [x] Show sync error with retry option

### 8.5 Client API Service
- [x] Create API service (`client/src/services/api/index.ts`)
- [x] Configure axios with base URL
- [x] Add device token to request headers
- [x] Implement device registration on first launch
- [x] Store device token securely (AsyncStorage)
- [x] Add request/response interceptors for error handling

---

## Phase 9: Polish & Enhancement

### 9.1 UI/UX Improvements
- [ ] Add loading indicators throughout app
- [ ] Add error handling and error messages
- [ ] Implement pull-to-refresh on list screens (with sync)
- [ ] Add haptic feedback on interactions
- [ ] Add smooth animations/transitions
- [ ] Implement dark mode support
- [ ] Add app icon
- [ ] Add launch screen

### 9.2 Data Validation & Edge Cases
- [ ] Validate all user inputs
- [ ] Handle database errors gracefully
- [ ] Handle API errors gracefully
- [ ] Handle edge case: activity deleted with existing sessions
- [ ] Handle edge case: milestone deleted with activities
- [ ] Confirm destructive actions (delete)
- [ ] Prevent duplicate sessions for same activity/date

### 9.3 Performance
- [ ] Optimize database queries
- [ ] Optimize sync payload size
- [ ] Implement list virtualization for large datasets
- [ ] Memoize expensive calculations
- [ ] Profile and fix any performance issues

---

## Phase 10: Advanced Features (Post-MVP)

### 10.1 Advanced Analytics
- [ ] Add performance trend charts (line charts)
- [ ] Add activity comparison charts
- [ ] Implement personal records tracking
- [ ] Add weekly summary view

### 10.2 Gamification
- [ ] Implement streak calculation logic (consecutive days)
- [ ] Create achievement badges system
- [ ] Define badge criteria (10 sessions, 30-day streak, etc.)
- [ ] Create badge display UI
- [ ] Add celebration animations

### 10.3 Notifications (Optional)
- [ ] Set up push notification permissions
- [ ] Implement daily reminder scheduling
- [ ] Create notification settings screen
- [ ] Implement achievement notifications

---

## Phase 11: Deployment & DevOps

### 11.1 Backend Deployment
- [ ] Set up production PostgreSQL database
- [ ] Run Sqitch migrations on production
- [ ] Deploy Go API (Railway, Fly.io, or similar)
- [ ] Configure environment variables
- [ ] Set up SSL/TLS
- [ ] Configure logging and monitoring

### 11.2 CI/CD Pipeline
- [ ] Set up GitHub Actions for Go tests
- [ ] Set up Sqitch migration verification in CI
- [ ] Automate deployment on main branch push
- [ ] Add database backup strategy

---

## Current Sprint Focus

**Sprint 1: Client MVP Foundation**
1. Project setup (Phase 1)
2. Milestone CRUD (Phase 2)
3. Activity CRUD (Phase 3)

**Sprint 2: Daily Tracking**
4. Daily tracking & dashboard (Phase 4)
5. Basic history (Phase 5)
6. Simple charts (Phase 6)

**Sprint 3: Backend & Sync**
7. Go backend setup (Phase 7)
8. Sync implementation (Phase 8)

---

**Last Updated:** 2026-03-31
