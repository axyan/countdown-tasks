package main

import (
	"context"
	"time"

	"github.com/axyan/countdown-tasks/service"
	user "github.com/axyan/countdown-tasks/user/pkg"
)

func main() {
	config := service.Config{
		Address:         "localhost:9002",
		DBDriver:        "postgres",
		DBConnURI:       "postgres://user:password@localhost:5432/db?sslmode=disable",
		RabbitMQConnURI: "amqp://guest:guest@localhost:5672/",
		RabbitMQQueues:  []string{},
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
