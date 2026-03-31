# BetterLife

A mobile habit and goal tracking application designed to prepare for fitness milestones. Built with Expo (React Native) and Go backend.

## Project Structure

```
betterlife/
├── client/          # Expo React Native app
├── server/          # Go backend API
└── docs/            # Documentation
```

## Features

- Create milestones with timelines
- Track activities (running, gym, etc.) with flexible units
- Daily goal tracking and logging
- Progress visualization with charts
- Offline-first with sync support

## Tech Stack

**Client:**
- Expo (React Native)
- TypeScript
- SQLite (expo-sqlite)
- Zustand (state management)
- React Navigation
- React Native Paper (UI)

**Server:**
- Go
- PostgreSQL
- Sqitch (migrations)

## Documentation

- [Project Idea](docs/PROJECT_IDEA.md)
- [Development Plan](docs/DEVELOPMENT_PLAN.md)
- [Todo List](docs/TODO.md)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Go 1.21+
- PostgreSQL 15+
- Sqitch
- iOS Simulator (Xcode) or Android Emulator

### Development

```bash
# Clone the repository
git clone https://github.com/irfanmaulana007/better-life.git
cd better-life

# Install client dependencies
cd client && npm install

# Start the Expo development server
npx expo start

# In a new terminal, start PostgreSQL (using Docker)
docker-compose up -d postgres

# Run migrations
cd server/migrations && sqitch deploy

# Start the server
cd server && go run cmd/api/main.go
```

### Using Makefile

```bash
# Show all available commands
make help

# Install client dependencies
make client-install

# Start Expo development server
make client-start

# Start on iOS simulator
make client-ios

# Start on Android emulator
make client-android

# Start database
make db-up

# Run migrations
make db-migrate

# Start Go server
make server-start
```

## License

Private - Personal Use Only
