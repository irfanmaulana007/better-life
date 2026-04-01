package main

import (
	"fmt"
	"log"

	"github.com/betterlife/server/internal/config"
	"github.com/betterlife/server/internal/handler"
	"github.com/betterlife/server/internal/middleware"
	"github.com/betterlife/server/internal/repository"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set Gin mode
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	db, err := repository.NewDB(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Connected to database")

	// Initialize repositories
	deviceRepo := repository.NewDeviceRepository(db)
	milestoneRepo := repository.NewMilestoneRepository(db)
	activityRepo := repository.NewActivityRepository(db)
	sessionRepo := repository.NewSessionRepository(db)

	// Initialize handlers
	healthHandler := handler.NewHealthHandler()
	deviceHandler := handler.NewDeviceHandler(deviceRepo)
	milestoneHandler := handler.NewMilestoneHandler(milestoneRepo)
	activityHandler := handler.NewActivityHandler(activityRepo)
	sessionHandler := handler.NewSessionHandler(sessionRepo)
	syncHandler := handler.NewSyncHandler(milestoneRepo, activityRepo, sessionRepo)

	// Create router
	r := gin.Default()

	// Global middleware
	r.Use(middleware.CORS())

	// Public routes
	r.GET("/health", healthHandler.Check)
	r.POST("/api/devices", deviceHandler.Register)

	// Protected routes (require device token)
	api := r.Group("/api")
	api.Use(middleware.DeviceAuth(deviceRepo))
	{
		// Milestones
		api.POST("/milestones", milestoneHandler.Create)
		api.GET("/milestones", milestoneHandler.GetAll)
		api.GET("/milestones/:id", milestoneHandler.GetByID)
		api.PUT("/milestones/:id", milestoneHandler.Update)
		api.DELETE("/milestones/:id", milestoneHandler.Delete)

		// Activities
		api.POST("/activities", activityHandler.Create)
		api.GET("/activities", activityHandler.GetAll)
		api.GET("/activities/:id", activityHandler.GetByID)
		api.PUT("/activities/:id", activityHandler.Update)
		api.DELETE("/activities/:id", activityHandler.Delete)

		// Sessions
		api.POST("/sessions", sessionHandler.Create)
		api.GET("/sessions", sessionHandler.GetAll)
		api.GET("/sessions/:id", sessionHandler.GetByID)
		api.PUT("/sessions/:id", sessionHandler.Update)
		api.DELETE("/sessions/:id", sessionHandler.Delete)

		// Sync
		api.POST("/sync/push", syncHandler.Push)
		api.GET("/sync/pull", syncHandler.Pull)
	}

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("Starting server on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
