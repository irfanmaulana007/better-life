.PHONY: help client-install client-start client-ios client-android server-start server-build db-up db-down db-migrate db-revert

help:
	@echo "BetterLife Development Commands"
	@echo ""
	@echo "Client commands (Expo):"
	@echo "  make client-install    - Install client dependencies"
	@echo "  make client-start      - Start Expo development server"
	@echo "  make client-ios        - Run on iOS simulator"
	@echo "  make client-android    - Run on Android emulator"
	@echo ""
	@echo "Server commands:"
	@echo "  make server-start      - Start Go server"
	@echo "  make server-build      - Build Go server"
	@echo ""
	@echo "Database commands:"
	@echo "  make db-up             - Start PostgreSQL container"
	@echo "  make db-down           - Stop PostgreSQL container"
	@echo "  make db-migrate        - Run Sqitch migrations"
	@echo "  make db-revert         - Revert last migration"
	@echo "  make db-verify         - Verify migrations"

# Client commands (Expo)
client-install:
	cd client && npm install

client-start:
	cd client && npx expo start

client-ios:
	cd client && npx expo start --ios

client-android:
	cd client && npx expo start --android

# Server commands
server-start:
	cd server && go run cmd/api/main.go

server-build:
	cd server && go build -o bin/api cmd/api/main.go

# Database commands
db-up:
	docker-compose up -d postgres

db-down:
	docker-compose down

db-migrate:
	cd server/migrations && sqitch deploy

db-revert:
	cd server/migrations && sqitch revert --to @HEAD^

db-verify:
	cd server/migrations && sqitch verify
