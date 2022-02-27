package main

import (
	"context"
	"time"

	auth "github.com/axyan/countdown-tasks/auth/pkg"
	"github.com/axyan/countdown-tasks/service"
)

func main() {
	config := service.Config{
		Address:         "localhost:9001",
		DBDriver:        "",
		DBConnURI:       "",
		RabbitMQConnURI: "amqp://guest:guest@localhost:5672/",
		RabbitMQQueues:  []string{"auth"},
	}

	svc := auth.NewAuthService(config)
	stop, errChan, err := svc.Start()
	if err != nil {
		svc.Logger().Fatalf("[ERROR] while starting service: %s", err.Error())
	}

	go func() {
		for err := range errChan {
			svc.Logger().Printf("[ERROR] while consuming requests: %s", err.Error())
		}
	}()

	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	svc.Stop(ctx)
}
