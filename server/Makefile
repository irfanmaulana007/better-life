.PHONY: help dev start build db-up db-down db-migrate db-revert db-verify

help:
	@echo "BetterLife Server Commands"
	@echo ""
	@echo "Server commands:"
	@echo "  make dev          - Start server with hot reload (air)"
	@echo "  make start        - Start Go server"
	@echo "  make build        - Build Go server"
	@echo ""
	@echo "Database commands:"
	@echo "  make db-up        - Start PostgreSQL container"
	@echo "  make db-down      - Stop PostgreSQL container"
	@echo "  make db-migrate   - Run Sqitch migrations"
	@echo "  make db-revert    - Revert last migration"
	@echo "  make db-verify    - Verify migrations"

# Server commands
dev:
	air

start:
	go run cmd/api/main.go

build:
	go build -o bin/api cmd/api/main.go

# Database commands
db-up:
	docker-compose -f ../docker-compose.yml up -d postgres

db-down:
	docker-compose -f ../docker-compose.yml down

db-migrate:
	cd migrations && sqitch deploy

db-revert:
	cd migrations && sqitch revert --to @HEAD^

db-verify:
	cd migrations && sqitch verify
