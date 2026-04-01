# BetterLife

A mobile habit and goal tracking app for fitness milestones.

## Tech Stack

**Client (Expo/React Native):**
- Expo 54, React Native 0.81, React 19
- TypeScript, Zustand (state), React Navigation
- expo-sqlite (local DB), React Native Paper (UI)
- react-hook-form + zod (forms/validation)
- victory-native (charts)

**Server (Go):**
- Go 1.25, Gin framework
- PostgreSQL + pgx/v5, Sqitch (migrations)
- Viper (config)

## Project Structure

```
client/
  src/
    components/    # Reusable UI components
    screens/       # Screen components
    navigation/    # React Navigation setup
    store/         # Zustand stores
    services/      # API client, database
    hooks/         # Custom React hooks
    types/         # TypeScript types
    utils/         # Utility functions

server/
  cmd/api/         # Main entry point
  internal/
    config/        # Configuration
    handler/       # HTTP handlers
    middleware/    # Gin middleware
    model/         # Data models
    repository/    # Database queries
    service/       # Business logic
  migrations/      # Sqitch SQL migrations
```

## Development Commands

```bash
# Client (from client/)
npm install            # Install dependencies
npx expo start         # Start Expo dev server
npx expo start --ios   # Run on iOS simulator
npx expo start --android  # Run on Android emulator

# Server (from server/ - uses Makefile)
make dev               # Start server with hot reload (air)
make start             # Run Go server
make build             # Build Go binary

# Database (from server/)
make db-up             # Start PostgreSQL (Docker)
make db-down           # Stop PostgreSQL
make db-migrate        # Run Sqitch migrations
make db-revert         # Revert last migration
```

## Code Conventions

- Client uses path aliases: `@/` maps to `src/`
- SQLite for offline-first, syncs to PostgreSQL backend
- Screens are in `src/screens/{ScreenName}/` directories
- State managed via Zustand stores in `src/store/`

### Documentation Files (`docs/`)
- Always use **kebab-case** (lowercase with hyphens)
- Use descriptive names: `feature-name.md`, `prd-feature.md`
- Examples:
  - `getting-started.md`
  - `app-description.md`
  - `prd-itinerary.md`
  - `tech-debt.md`

## Git Workflow

### Important Rules

1. **Always create a new branch first** — Before making ANY changes (code, docs, config), create a new branch from `main`
2. **Never commit directly to `main`** — All changes must go through a feature branch and PR
3. **Never commit automatically** — After making changes, STOP and wait for user to review first
4. **One branch per issue/feature** — Each task should have its own dedicated branch

> **CRITICAL FOR CLAUDE:** Before making ANY changes to the codebase:
> 1. Check current branch with `git branch --show-current`
> 2. If on `main`, create a new branch first
> 3. Only then start making changes
>
> After making changes, do NOT commit automatically. Wait for user review.

### Before Starting Any Task

```bash
# 1. Check current branch - if on main, create new branch
git branch --show-current

# 2. If on main, switch and create new branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name   # For new features
git checkout -b fix/your-fix-name           # For bug fixes
git checkout -b docs/your-doc-name          # For documentation

# 3. Now you can start making changes
```

### Branch Naming Conventions

| Prefix | Usage | Example |
|--------|-------|---------|
| `feature/` | New features | `feature/itinerary`, `feature/dark-mode` |
| `fix/` | Bug fixes | `fix/layout-shift`, `fix/auth-token` |
| `refactor/` | Code refactoring | `refactor/auth-flow` |
| `chore/` | Maintenance tasks | `chore/update-deps` |
| `docs/` | Documentation | `docs/api-reference` |

### After Making Changes

```bash
# 1. Claude makes changes, then STOPS for user to review
# 2. User reviews the changes (git diff, git status)
# 3. User runs /pr which will:
#    - Commit all changes
#    - Push the branch
#    - Create the PR with appropriate label
/pr
```

### PR Labels

The `/pr` command automatically assigns one of these labels:

| Label | When to Use |
|-------|-------------|
| `feature` | New functionality that didn't exist before |
| `enhancement` | Improvements to existing features |
| `bug` | Fixing broken functionality |
| `documentation` | Documentation-only changes |

### Commit Message Format

Use conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code refactoring
- `chore:` — Maintenance
- `docs:` — Documentation

## Code Quality Workflow

## Debugging

**Enable API debug logging** by setting in `.env`:

```bash
API_LOGGING_ENABLED=true
```

This logs all API requests/responses to the console with emoji prefixes:
- `📤` API REQUEST - method, URL, params, body
- `📥` API RESPONSE - URL, status, data
- `❌` API ERROR - URL, status, message, error data

Logging can also be toggled at runtime via `setApiLogging(true/false)` from `@/services/api`.
