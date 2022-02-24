package main

import (
	"context"
	"time"

	"github.com/axyan/countdown-tasks/service"
	user "github.com/axyan/countdown-tasks/user/src"
)

func main() {
	config := service.Config{
		Address:   "localhost:9002",
		DBDriver:  "postgres",
		DBConnURI: "postgres://user:password@localhost:5432/db?sslmode=disable",
	}

	svc := user.NewUserService(config)
	stop, err := svc.Start()
	if err != nil {
		svc.Logger().Fatalf("[ERROR] while starting service: %s", err.Error())
	}

	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	svc.Stop(ctx)
}
