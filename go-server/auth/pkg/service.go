package auth

import (
	"bytes"
	"context"
	"encoding/json"
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

type ValidationResponse service.ValidationResponse

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

		var response ValidationResponse
		command := strings.Split(msg.RoutingKey, ".")[1]
		switch command {

		case "generate":
			token, err := generateToken(string(msg.Body))
			if err != nil {
				a.Logger().Printf("[ERROR] Worker %d - error generating token: %s", workerId, err.Error())
				response = ValidationResponse{
					"",
					"",
					err.Error(),
				}
				break
			}
			response = ValidationResponse{
				"",
				token,
				"",
			}

		case "validate":
			claims, isValid, err := a.Validate(string(msg.Body))

			if err != nil {
				a.Logger().Printf("[ERROR] Worker %d - error validating token: %v", workerId, err)
				response = ValidationResponse{
					"",
					"",
					err.Error(),
				}
				break
			} else if !isValid {
				response = ValidationResponse{
					"",
					"",
					"invalid token",
				}
				break
			}
			response = ValidationResponse{
				claims.UserID,
				"",
				"",
			}

		default:
			a.Logger().Printf("[ERROR] Worker %d - received unknown command for routing key: %s", workerId, msg.RoutingKey)
			return
		}

		// Serialize response to bytes
		var b bytes.Buffer
		encoder := json.NewEncoder(&b)
		if err := encoder.Encode(response); err != nil {
			a.Logger().Printf("[ERROR] Worker %d - while encoding response: %v", workerId, response)
			return
		}

		err = ch.Publish(
			"",
			msg.ReplyTo,
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        b.Bytes(),
			},
		)
		if err != nil {
			msgErrChan <- err
		}

		a.Logger().Printf("[INFO] Worker %d - published message: %s", workerId, b.String())

		if err := ch.Ack(msg.DeliveryTag, false); err != nil {
			msgErrChan <- err
		}
	}

	a.Logger().Printf("[INFO] Worker %d - deliveries channel closed", workerId)
}
