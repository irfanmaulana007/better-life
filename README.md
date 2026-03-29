# BetterLife

A mobile habit and goal tracking application designed to prepare for fitness milestones. Built with React Native (iOS) and Go backend.

## Project Structure

```
betterlife/
├── client/          # React Native iOS app
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
- React Native (iOS)
- TypeScript
- SQLite (local storage)
- Zustand (state management)

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
- Xcode 14+
- Go 1.21+
- PostgreSQL 15+
- Sqitch

### Development

```bash
# Clone the repository
git clone https://github.com/irfanmaulana007/better-life.git
cd better-life

# Start PostgreSQL (using Docker)
docker-compose up -d postgres

# Run migrations
cd server/migrations && sqitch deploy

# Start the server
cd server && go run cmd/api/main.go

# Install client dependencies
cd client && npm install && npx pod-install

# Start the client
npm start
```

## License

Private - Personal Use Only
