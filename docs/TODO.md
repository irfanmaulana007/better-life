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
- [ ] Implement `createActivity` database function
- [ ] Implement `getActivitiesByMilestone` database function
- [ ] Implement `getActivityById` database function
- [ ] Implement `updateActivity` database function
- [ ] Implement `deleteActivity` database function (soft delete)
- [ ] Implement `getActivitiesByScheduleDay` function (for daily view)

### 3.2 Activity List Screen
- [ ] Create ActivityListScreen component
- [ ] Create ActivityCard component
- [ ] Display activity name, unit type, target
- [ ] Display scheduled days as badges (M, T, W, T, F, S, S)
- [ ] Add FAB button to create new activity
- [ ] Filter activities by selected milestone
- [ ] Handle empty state

### 3.3 Create/Edit Activity Screen
- [ ] Create ActivityFormScreen component
- [ ] Add name input field
- [ ] Create unit type selector (distance, time, reps, counter)
- [ ] Add unit name input (km, minutes, reps, etc.)
- [ ] Add target goal input (optional, numeric)
- [ ] Create day-of-week multi-select component
- [ ] Add milestone selector (if creating from general screen)
- [ ] Implement form validation
- [ ] Handle create mode vs edit mode
- [ ] Save activity to database

### 3.4 Activity Detail Screen
- [ ] Create ActivityDetailScreen component
- [ ] Display full activity information
- [ ] Show recent sessions for this activity
- [ ] Link to full history for this activity
- [ ] Add edit/delete actions

---

## Phase 4: Daily Tracking & Dashboard (MVP)

### 4.1 Session CRUD Operations
- [ ] Implement `createSession` database function
- [ ] Implement `getSessionsByDate` database function
- [ ] Implement `getSessionsByActivity` database function
- [ ] Implement `getSessionsByDateRange` database function
- [ ] Implement `updateSession` database function
- [ ] Implement `deleteSession` database function (soft delete)

### 4.2 Dashboard / Home Screen
- [ ] Create HomeScreen component
- [ ] Create DashboardHeader component (milestone name, countdown)
- [ ] Fetch today's scheduled activities
- [ ] Create TodayActivityList component
- [ ] Create TodayActivityCard component
- [ ] Show activity name, target, completion status
- [ ] Add quick complete toggle
- [ ] Create DailyProgressBar component
- [ ] Create StreakCounter component
- [ ] Calculate current streak

### 4.3 Session Logging Modal
- [ ] Create LogSessionModal component
- [ ] Display activity name and target goal
- [ ] Add "Mark as completed" toggle
- [ ] Create dynamic input based on unit type:
  - [ ] Distance input (numeric, km)
  - [ ] Time input (hours:minutes picker)
  - [ ] Reps input (numeric)
  - [ ] Counter input (numeric)
- [ ] Add optional notes text field
- [ ] Implement save logic
- [ ] Close modal on save
- [ ] Update UI to reflect new session

### 4.4 Date Navigation
- [ ] Create DateSelector component
- [ ] Allow navigating to past dates
- [ ] Allow navigating to future dates (for planning)
- [ ] Fetch activities and sessions for selected date
- [ ] Show existing sessions for past dates
- [ ] Allow editing past sessions

---

## Phase 5: History Screen (MVP)

### 5.1 History Screen UI
- [ ] Create HistoryScreen component
- [ ] Create ActivityFilterDropdown component
- [ ] Create DateRangePicker component
- [ ] Create SessionListItem component
- [ ] Display session date, activity, target, actual result
- [ ] Show completion status indicator
- [ ] Implement infinite scroll / pagination

### 5.2 History Functionality
- [ ] Implement filter by activity
- [ ] Implement filter by date range
- [ ] Implement search by activity name
- [ ] Add tap to view session detail
- [ ] Add edit session capability
- [ ] Add delete session with confirmation
- [ ] Handle empty state (no sessions)

---

## Phase 6: Charts & Analytics (MVP)

### 6.1 Chart Data Services
- [ ] Create analytics service (`client/src/services/analytics/index.ts`)
- [ ] Implement `getVolumeOverTime` function (weekly/monthly totals)
- [ ] Implement `getCompletionRate` function (completed/scheduled %)
- [ ] Implement `getPerformanceTrend` function (average per session)
- [ ] Implement `getStreakData` function

### 6.2 Charts Screen
- [ ] Create ChartsScreen component
- [ ] Create chart type tab selector
- [ ] Create VolumeChart component using Victory Native
- [ ] Create CompletionRateChart component
- [ ] Add activity filter for charts
- [ ] Add date range filter for charts
- [ ] Create StreakDisplay component (prominent)

### 6.3 Chart Interactivity
- [ ] Add touch interaction to charts (show values)
- [ ] Implement weekly/monthly toggle
- [ ] Add loading states for chart data
- [ ] Handle empty chart states

---

## Phase 7: Go Backend Setup

### 7.1 Project Initialization
- [ ] Create server/ directory structure:
  ```
  server/
  ├── cmd/api/
  ├── internal/
  ├── migrations/
  └── pkg/
  ```
- [ ] Initialize Go module (`cd server && go mod init github.com/yourusername/betterlife/server`)
- [ ] Install Gin or Echo framework
- [ ] Install PostgreSQL driver (pgx or lib/pq)
- [ ] Install sqlx for database operations
- [ ] Set up environment configuration (viper or envconfig)
- [ ] Create server/Dockerfile for the API
- [ ] Update root docker-compose.yml to include API service
- [ ] Update root Makefile with server commands

### 7.2 Sqitch Setup & Migrations
- [ ] Install Sqitch (`brew install sqitch`)
- [ ] Initialize Sqitch project in server/migrations/ (`cd server/migrations && sqitch init betterlife --engine pg`)
- [ ] Configure sqitch.conf with PostgreSQL settings
- [ ] Create migration: `sqitch add 001-create-milestones`
  ```sql
  -- deploy/001-create-milestones.sql
  CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    device_token TEXT NOT NULL,
    local_id UUID NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(device_token, local_id)
  );
  ```
- [ ] Create migration: `sqitch add 002-create-activities`
  ```sql
  -- deploy/002-create-activities.sql
  CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    device_token TEXT NOT NULL,
    local_id UUID NOT NULL,
    milestone_id INTEGER REFERENCES milestones(id),
    milestone_local_id UUID NOT NULL,
    name TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    target_goal NUMERIC,
    schedule_days INTEGER[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(device_token, local_id)
  );
  ```
- [ ] Create migration: `sqitch add 003-create-sessions`
  ```sql
  -- deploy/003-create-sessions.sql
  CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    device_token TEXT NOT NULL,
    local_id UUID NOT NULL,
    activity_id INTEGER REFERENCES activities(id),
    activity_local_id UUID NOT NULL,
    date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    actual_result NUMERIC,
    target_goal NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(device_token, local_id)
  );
  ```
- [ ] Create migration: `sqitch add 004-create-indexes`
- [ ] Write revert scripts for all migrations
- [ ] Write verify scripts for all migrations
- [ ] Test migrations: deploy, verify, revert, re-deploy

### 7.3 Backend Project Structure
- [ ] Create server/cmd/api/main.go (entry point)
- [ ] Create server/internal/config (configuration loading)
- [ ] Create server/internal/model (data structures)
- [ ] Create server/internal/repository (database layer)
- [ ] Create server/internal/service (business logic)
- [ ] Create server/internal/handler (HTTP handlers)
- [ ] Create server/internal/middleware (auth, logging, CORS)
- [ ] Create server/pkg/response (standard API responses)

### 7.4 Core API Endpoints
- [ ] Implement health check endpoint (GET /health)
- [ ] Implement device registration (POST /api/devices - generates token)
- [ ] Implement milestones CRUD:
  - [ ] POST /api/milestones
  - [ ] GET /api/milestones
  - [ ] GET /api/milestones/:id
  - [ ] PUT /api/milestones/:id
  - [ ] DELETE /api/milestones/:id
- [ ] Implement activities CRUD:
  - [ ] POST /api/activities
  - [ ] GET /api/activities
  - [ ] GET /api/activities/:id
  - [ ] PUT /api/activities/:id
  - [ ] DELETE /api/activities/:id
- [ ] Implement sessions CRUD:
  - [ ] POST /api/sessions
  - [ ] GET /api/sessions
  - [ ] GET /api/sessions/:id
  - [ ] PUT /api/sessions/:id
  - [ ] DELETE /api/sessions/:id

### 7.5 Authentication Middleware
- [ ] Create device token middleware
- [ ] Validate token on protected routes
- [ ] Extract device_token from Authorization header
- [ ] Pass device_token to handlers via context

---

## Phase 8: Sync Implementation

### 8.1 Server Sync Endpoints
- [ ] Create sync handler (server/internal/handler/sync.go)
- [ ] Implement POST /api/sync/push
  - [ ] Accept batch of changes (milestones, activities, sessions)
  - [ ] Process creates: insert new records, return server_id
  - [ ] Process updates: update existing records by local_id
  - [ ] Process deletes: set deleted_at timestamp
  - [ ] Return sync results with server_id mappings
- [ ] Implement GET /api/sync/pull?since=timestamp
  - [ ] Return all records updated since timestamp
  - [ ] Include soft-deleted records (for client to delete locally)
  - [ ] Support pagination for large datasets

### 8.2 Client Sync Service
- [ ] Create sync service (`client/src/services/sync/index.ts`)
- [ ] Implement network status detection (NetInfo)
- [ ] Implement `getPendingChanges` function (query sync_status='pending')
- [ ] Implement `pushChanges` function
  - [ ] Batch pending changes by entity type
  - [ ] Send to POST /api/sync/push
  - [ ] Update local records with server_id
  - [ ] Set sync_status='synced'
- [ ] Implement `pullChanges` function
  - [ ] Call GET /api/sync/pull?since=lastSyncTime
  - [ ] Merge server changes into local SQLite
  - [ ] Handle conflicts (server wins by timestamp)
  - [ ] Update lastSyncTime
- [ ] Implement `fullSync` function (push then pull)

### 8.3 Sync Triggers
- [ ] Trigger sync on app foreground (AppState listener)
- [ ] Trigger sync on pull-to-refresh
- [ ] Trigger sync after successful data modification (debounced)
- [ ] Add manual sync button in settings

### 8.4 Sync UI Feedback
- [ ] Create SyncStatusIndicator component
- [ ] Show "Syncing..." during sync
- [ ] Show "Last synced: X minutes ago"
- [ ] Show "Offline" when no network
- [ ] Show sync error with retry option

### 8.5 Client API Service
- [ ] Create API service (`client/src/services/api/index.ts`)
- [ ] Configure axios with base URL
- [ ] Add device token to request headers
- [ ] Implement device registration on first launch
- [ ] Store device token securely (AsyncStorage)
- [ ] Add request/response interceptors for error handling
- [ ] Implement retry logic with exponential backoff

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
