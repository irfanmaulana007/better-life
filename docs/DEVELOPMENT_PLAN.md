# Development Plan: BetterLife

## Overview

This document outlines the development approach for the BetterLife mobile application. The plan follows the MVP-first approach defined in the PRD, focusing on React Native (iOS) client development initially, with a Go backend for data persistence and sync.

### Architecture: Offline-First + Sync

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Native Client                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Screens   │◄──►│   Zustand   │◄──►│  SQLite (Local DB)  │  │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘  │
│                                                    │             │
│                                         ┌──────────▼──────────┐  │
│                                         │    Sync Service     │  │
│                                         └──────────┬──────────┘  │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
                                          ┌──────────▼──────────┐
                                          │     Go Backend      │
                                          │    (REST API)       │
                                          └──────────┬──────────┘
                                                     │
                                          ┌──────────▼──────────┐
                                          │    PostgreSQL       │
                                          │  (Sqitch Migrations)│
                                          └─────────────────────┘
```

**Key Principles:**
- Client works fully offline using local SQLite
- Background sync when network is available
- Server is source of truth for conflict resolution
- Sqitch manages PostgreSQL schema migrations

### Repository Structure: Monorepo

```
betterlife/
├── client/                  # React Native iOS app
│   ├── src/
│   ├── ios/
│   ├── package.json
│   └── tsconfig.json
├── server/                  # Go backend
│   ├── cmd/
│   ├── internal/
│   ├── migrations/          # Sqitch migrations
│   ├── go.mod
│   └── Dockerfile
├── docs/                    # Documentation
│   ├── PROJECT_IDEA.md
│   ├── DEVELOPMENT_PLAN.md
│   └── TODO.md
├── docker-compose.yml       # Local development (PostgreSQL + API)
├── Makefile                 # Common commands
└── README.md
```

**Why Monorepo:**
- Single repository for easier management
- Atomic commits across client + server
- Shared documentation
- Simpler CI/CD pipeline
- No version compatibility tracking needed

---

## Phase 1: Project Setup & Foundation

### 1.1 Monorepo Initialization
- Initialize Git repository at root
- Create directory structure (client/, server/, docs/)
- Create root README.md
- Create root .gitignore (covering both Node.js and Go)
- Create Makefile with common commands
- Create docker-compose.yml for local PostgreSQL

### 1.2 React Native Project Initialization
- Initialize React Native project in client/ directory with TypeScript template
- Configure iOS-specific settings (iOS 14+ target)
- Set up project structure (folders for screens, components, services, types, etc.)
- Configure ESLint and Prettier for code consistency

### 1.2 Core Dependencies
- Navigation: React Navigation (stack + bottom tabs)
- State Management: Zustand
- Local Storage: SQLite (react-native-sqlite-storage)
- UI Components: React Native Paper or NativeBase
- Charts: Victory Native or react-native-chart-kit
- Date Handling: date-fns
- Form Handling: React Hook Form + Zod validation
- HTTP Client: Axios or fetch with retry logic
- UUID: react-native-uuid (for offline ID generation)

### 1.3 Local Database Schema Setup (SQLite)
- Implement SQLite database initialization
- Create local migration system for schema versioning
- Define TypeScript interfaces matching data model
- Build database service layer (CRUD operations)
- Add sync metadata columns (sync_status, updated_at, server_id)

---

## Phase 2: Core Data Management (MVP)

### 2.1 Milestone Management
- **Create Milestone Screen**
  - Form: name, start date, end date (optional)
  - Date picker component
  - Validation logic
- **Milestone List Screen**
  - Card-based list view
  - Show name, dates, days remaining, activity count
  - Swipe actions (edit/delete)
- **Milestone Detail Screen**
  - Display milestone info
  - List associated activities
  - Edit/delete milestone actions

### 2.2 Activity Management
- **Create Activity Screen**
  - Form: name, unit type, unit name, target goal, schedule days
  - Unit type selector (distance, time, reps, counter)
  - Day-of-week multi-select (Mon-Sun)
  - Link to milestone
- **Activity List Screen**
  - List activities under selected milestone
  - Show unit type, target, scheduled days
  - Edit/delete actions
- **Activity Detail Screen**
  - Full activity info
  - Quick access to history for this activity

---

## Phase 3: Daily Tracking (MVP)

### 3.1 Dashboard / Home Screen
- Header with current milestone info
- Today's scheduled activities list
- Quick completion toggle
- Daily progress indicator
- Current streak display
- Bottom tab navigation

### 3.2 Session Logging
- **Log Session Modal**
  - Activity name and target display
  - Mark complete toggle
  - Actual result input (dynamic based on unit type)
  - Optional notes field
  - Save/cancel actions
- **Session Service**
  - Create session record
  - Update session record
  - Get sessions by date
  - Get sessions by activity

### 3.3 Date Navigation
- Date selector on daily view
- Navigate to past/future dates
- Show scheduled activities for selected date
- Historical session data display

---

## Phase 4: History & Data Visualization (MVP)

### 4.1 History Screen
- Activity filter dropdown
- Date range picker
- Chronological session list
- Session details (date, target, actual, status)
- Edit/delete session capability

### 4.2 Basic Charts Screen
- **Volume Over Time Chart**
  - Weekly/monthly totals per activity
  - Bar or line chart visualization
- **Completion Rate Chart**
  - Percentage of scheduled vs completed
  - Weekly breakdown
- Chart filters (activity, date range)

---

## Phase 5: Enhanced Features (Post-MVP)

### 5.1 Advanced Analytics
- Performance trend line charts
- Activity comparison charts
- Moving averages
- Personal records tracking

### 5.2 Streak & Gamification
- Streak calculation logic
- Streak display on dashboard
- Achievement badges system
- Milestone completion celebrations

### 5.3 Notifications (Optional)
- Daily reminder notifications
- Achievement notifications
- Configure notification preferences

---

## Phase 6: Go Backend

### 6.1 Project Setup
- Initialize Go module
- Set up project structure (cmd, internal, pkg)
- Choose HTTP framework (Gin or Echo)
- Configure environment variables
- Set up Docker for local development
- Configure PostgreSQL connection

### 6.2 Database with Sqitch
- Install and initialize Sqitch for PostgreSQL
- Create Sqitch project structure
- Define initial migration: milestones table
- Define migration: activities table
- Define migration: sessions table
- Define migration: sync_log table (for tracking changes)
- Add indexes for common queries
- Set up CI/CD for migrations

### 6.3 API Implementation
- **Milestones API**
  - POST /api/milestones
  - GET /api/milestones
  - GET /api/milestones/:id
  - PUT /api/milestones/:id
  - DELETE /api/milestones/:id
- **Activities API**
  - POST /api/activities
  - GET /api/activities?milestone_id=
  - GET /api/activities/:id
  - PUT /api/activities/:id
  - DELETE /api/activities/:id
- **Sessions API**
  - POST /api/sessions
  - GET /api/sessions?activity_id=&date_from=&date_to=
  - GET /api/sessions/:id
  - PUT /api/sessions/:id
  - DELETE /api/sessions/:id
- **Sync API**
  - POST /api/sync/push (client sends changes)
  - GET /api/sync/pull?since= (client fetches changes)

### 6.4 Authentication (Simple)
- Device-based token (no user accounts needed)
- Generate token on first app launch
- Store token securely on device
- Include token in API headers

---

## Phase 7: Sync Implementation

### 7.1 Sync Strategy: Last-Write-Wins with Timestamps

**Local SQLite Schema Additions:**
```sql
-- Each table includes:
local_id        TEXT PRIMARY KEY  -- UUID generated locally
server_id       INTEGER           -- ID from server (null until synced)
sync_status     TEXT              -- 'pending', 'synced', 'conflict'
updated_at      TEXT              -- ISO timestamp
deleted_at      TEXT              -- Soft delete timestamp
```

**Sync Flow:**
1. User makes changes → saved to SQLite with sync_status='pending'
2. Sync service detects network availability
3. Push: Send all pending changes to server
4. Server processes changes, returns server_id mappings
5. Pull: Fetch changes from server since last sync
6. Merge server changes into local SQLite
7. Update sync_status to 'synced'

### 7.2 Conflict Resolution
- **Strategy**: Server timestamp wins (last-write-wins)
- Compare updated_at timestamps
- If server version is newer, overwrite local
- If local version is newer, push to server
- Soft deletes to handle deletion conflicts

### 7.3 Client Sync Service
- Background sync on app foreground
- Manual sync trigger (pull-to-refresh)
- Sync status indicator in UI
- Retry logic with exponential backoff
- Queue management for offline changes

### 7.4 Server Sync Endpoints
- **POST /api/sync/push**
  - Receives batch of changes (create, update, delete)
  - Processes each change with conflict detection
  - Returns results with server_id mappings
- **GET /api/sync/pull?since=timestamp**
  - Returns all changes since given timestamp
  - Includes soft-deleted records

---

## Technical Architecture

### Monorepo Structure
```
betterlife/
├── client/                      # React Native iOS app
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── common/          # Buttons, inputs, cards
│   │   │   ├── charts/          # Chart components
│   │   │   └── forms/           # Form components
│   │   ├── screens/             # Screen components
│   │   │   ├── home/
│   │   │   ├── milestones/
│   │   │   ├── activities/
│   │   │   ├── history/
│   │   │   └── charts/
│   │   ├── navigation/          # Navigation configuration
│   │   ├── services/            # Business logic & API
│   │   │   ├── database/        # SQLite operations
│   │   │   ├── api/             # REST API client
│   │   │   ├── sync/            # Sync logic
│   │   │   └── analytics/       # Chart data processing
│   │   ├── store/               # Zustand state management
│   │   ├── types/               # TypeScript interfaces
│   │   ├── utils/               # Helper functions
│   │   ├── hooks/               # Custom React hooks
│   │   └── constants/           # App constants
│   ├── ios/                     # iOS native code
│   ├── package.json
│   ├── tsconfig.json
│   └── app.json
│
├── server/                      # Go backend
│   ├── cmd/
│   │   └── api/
│   │       └── main.go          # Entry point
│   ├── internal/
│   │   ├── config/              # Configuration
│   │   ├── handler/             # HTTP handlers
│   │   ├── middleware/          # Auth, logging, etc.
│   │   ├── model/               # Data models
│   │   ├── repository/          # Database operations
│   │   ├── service/             # Business logic
│   │   └── sync/                # Sync logic
│   ├── migrations/              # Sqitch migrations
│   │   ├── sqitch.plan
│   │   ├── sqitch.conf
│   │   ├── deploy/
│   │   │   ├── 001-create-milestones.sql
│   │   │   ├── 002-create-activities.sql
│   │   │   ├── 003-create-sessions.sql
│   │   │   └── 004-create-indexes.sql
│   │   ├── revert/
│   │   └── verify/
│   ├── pkg/                     # Shared utilities
│   ├── Dockerfile
│   └── go.mod
│
├── docs/                        # Documentation
│   ├── PROJECT_IDEA.md
│   ├── DEVELOPMENT_PLAN.md
│   └── TODO.md
│
├── docker-compose.yml           # PostgreSQL + API for local dev
├── Makefile                     # Common commands
├── .gitignore
└── README.md
```

### Key Design Decisions
1. **Monorepo**: Single repository for client and server, easier coordination
2. **Offline-first**: SQLite for local storage, works without network
3. **Sync on demand**: Background sync when online, manual trigger available
4. **UUID for local IDs**: Avoids conflicts before sync
5. **Soft deletes**: Enables proper sync of deletions
6. **Sqitch for migrations**: Plain SQL, version controlled, reversible
7. **Last-write-wins**: Simple conflict resolution based on timestamps
8. **TypeScript + Go**: Type safety on both ends

---

## Testing Strategy

### Client Tests
- Unit tests for database service functions
- Unit tests for sync logic
- Unit tests for utility functions
- Integration tests for screen navigation
- E2E tests for critical user flows

### Server Tests
- Unit tests for handlers
- Unit tests for repository layer
- Integration tests for API endpoints
- Integration tests for sync endpoints
- Sqitch verify scripts for migrations

### Sync Testing
- Test offline changes sync correctly
- Test conflict resolution scenarios
- Test network failure recovery
- Test large batch syncs

---

## Definition of Done

### For Each Feature
- [ ] Implementation complete
- [ ] TypeScript/Go types defined
- [ ] Basic error handling
- [ ] UI matches design intent
- [ ] Tested on iOS simulator
- [ ] No console errors/warnings

### For MVP Release (Client)
- [ ] All Phase 1-4 features complete
- [ ] Local database stable
- [ ] App works fully offline
- [ ] Data persists across app restarts

### For Sync Release
- [ ] Go backend deployed
- [ ] Sqitch migrations applied
- [ ] Sync working reliably
- [ ] Conflict resolution tested
- [ ] Can track activities across app reinstalls

---

**Document Version:** 2.0
**Created:** 2026-03-30
**Updated:** 2026-03-30
