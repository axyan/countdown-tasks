package main

import (
	"context"
	"time"

	authentication "github.com/axyan/countdown-tasks/authentication/src"
	"github.com/axyan/countdown-tasks/service"
)

func main() {
	routes := authentication.GetAllRoutes()

	config := service.Config{
		Address:   "localhost:9001",
		DBDriver:  "postgres",
		DBConnURI: "postgres://user:password@localhost:5432/db?sslmode=disable",
		Routes:    routes,
	}

	svc := authentication.NewAuthenticationService(config)
	stop, err := svc.Run()
	if err != nil {
		svc.Logger().Fatalf("[ERROR] while starting service: %s", err.Error())
	}

	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	svc.Shutdown(ctx)
}
