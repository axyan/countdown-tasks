package auth

import (
	"context"
	"os"
	"runtime"
	"strings"

	"github.com/axyan/countdown-tasks/service"
	amqp "github.com/rabbitmq/amqp091-go"
)

type IAuthService interface {
	service.IService
	Blacklist() *BlacklistDB
}

type AuthService struct {
	service.IService
	*BlacklistDB
}

func NewAuthService(config service.Config) *AuthService {
	return &AuthService{
		service.NewService("Auth", config),
		NewBlacklistDB(),
	}
}

func (a *AuthService) Start() (<-chan os.Signal, <-chan error, error) {
	stop, err := a.Run()
	if err != nil {
		return nil, nil, err
	}

	a.InitializeRoutes()

	errChan, err := a.ConsumeRequests()
	if err != nil {
		return nil, nil, err
	}

	return stop, errChan, nil
}

func (a *AuthService) Stop(ctx context.Context) {
	if err := a.Blacklist().Close(); err != nil {
		a.Logger().Printf("[ERROR] while closing blacklist database: %s", err.Error())
	}
	a.Shutdown(ctx)
}

func (a *AuthService) Blacklist() *BlacklistDB {
	return a.BlacklistDB
}

func (a *AuthService) ConsumeRequests() (<-chan error, error) {
	msgErrChan := make(chan error, 1)

	threads := runtime.GOMAXPROCS(0)
	for i := 0; i < threads; i++ {
		go a.authWorker(i, msgErrChan)
	}

	return msgErrChan, nil
}

func (a *AuthService) authWorker(workerId int, msgErrChan chan error) {
	ch, err := a.Broker().Channel()
	if err != nil {
		a.Logger().Printf("[ERROR] Worker %d - while opening channel: %s", workerId, err.Error())
		return
	}
	defer ch.Close()

	err = ch.QueueBind(
		"auth",
		"auth.*",
		"amq.topic",
		false,
		nil,
	)
	if err != nil {
		a.Logger().Printf("[ERROR] Worker %d - while binding to queue: %s", workerId, err.Error())
	}

	msgs, err := ch.Consume(
		"auth",
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		a.Logger().Printf("[ERROR] Worker %d - while consuming from channel: %s", workerId, err.Error())
	}

	a.Logger().Printf("[INFO] Worker %d - consuming messages from queue auth", workerId)
	for msg := range msgs {
		a.Logger().Printf("[INFO] Worker %d - received message: %s", workerId, string(msg.Body))

		var reply = ""
		command := strings.Split(msg.RoutingKey, ".")[1]
		switch command {
		case "generate":
			reply, err = generateToken(string(msg.Body))
			if err != nil {
				a.Logger().Printf("[INFO] Worker %d - error generating token: %s", workerId, err.Error())
				reply = "internal server error" // Probably need to standardize this for client
			}

		case "validate":
			reply, err = a.Validate(string(msg.Body))
			if err != nil {
				a.Logger().Printf("[INFO] Worker %d - error validating token: %s", workerId, err.Error())
				reply = "false" // Ensure reply is false
			}

		default:
			a.Logger().Printf("[INFO] Worker %d - received unknown command for routing key: %s", workerId, msg.RoutingKey)
			return
		}

		err = ch.Publish(
			"",
			msg.ReplyTo,
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        []byte(reply),
			},
		)
		if err != nil {
			msgErrChan <- err
		}

		a.Logger().Printf("[INFO] Worker %d - published message: %s", workerId, reply)

		if err := ch.Ack(msg.DeliveryTag, false); err != nil {
			msgErrChan <- err
		}
	}

	a.Logger().Printf("[INFO] Worker %d - deliveries channel closed", workerId)
}
