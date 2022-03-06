package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
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

// NewAuthService returns a pointer to a new auth service
func NewAuthService(config service.Config) *AuthService {
	return &AuthService{
		service.NewService(
			"Auth",
			log.New(os.Stdout, fmt.Sprintf("[%s Service] ", "Auth"), log.LstdFlags),
			config),
		NewBlacklistDB(),
	}
}

// Blacklist returns a pointer to the blacklist database
func (a *AuthService) Blacklist() *BlacklistDB {
	return a.BlacklistDB
}

// Start starts the service by initializing the routes and creating workers
// to consume incoming message requests
func (a *AuthService) Start() (<-chan os.Signal, <-chan error, error) {
	stop, err := a.Run()
	if err != nil {
		return nil, nil, err
	}

	a.InitializeRoutes()

	errChan := a.ConsumeRequests()

	return stop, errChan, nil
}

// Stop stops the service gracefully
func (a *AuthService) Stop(ctx context.Context) {
	if err := a.Blacklist().Close(); err != nil {
		a.Logger().Printf("[ERROR] while closing blacklist database: %v", err)
	}
	a.Shutdown(ctx)
}

// ConsumeRequests creates workers to consume message requests for generating
// and validating tokens
func (a *AuthService) ConsumeRequests() <-chan error {
	msgErrChan := make(chan error, 1)

	threads := runtime.GOMAXPROCS(0)
	for i := 0; i < threads; i++ {
		go a.authWorker(i, msgErrChan)
	}

	return msgErrChan
}

// authWorker consumes messages from the message broker and responds appropriately
// based on message topic (currently only 'auth.generate' to generate new token
// and 'auth.validate' to validate token)
// TODO: refactor code
func (a *AuthService) authWorker(workerId int, msgErrChan chan error) {
	ch, err := a.Broker().Channel()
	if err != nil {
		msgErrChan <- fmt.Errorf("worker %d - while opening channel: %v", workerId, err)
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
		msgErrChan <- fmt.Errorf("worker %d - while binding to queue: %v", workerId, err)
		return
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
		msgErrChan <- fmt.Errorf("worker %d - while consuming from channel: %v", workerId, err)
		return
	}

	a.Logger().Printf("[INFO] worker %d - consuming messages from queue auth", workerId)

	for msg := range msgs {
		a.Logger().Printf("[INFO] worker %d - received message: %s", workerId, string(msg.Body))

		var response ValidationResponse
		command := strings.Split(msg.RoutingKey, ".")[1]
		switch command {

		case "generate":
			token, err := generateToken(string(msg.Body))
			if err != nil {
				msgErrChan <- fmt.Errorf("worker %d - error generating token: %v", workerId, err)
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
				msgErrChan <- fmt.Errorf("worker %d - error validating token: %v", workerId, err)
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
			a.Logger().Printf("[WARNING] worker %d - received unknown command for routing key: %s", workerId, msg.RoutingKey)
			return
		}

		// Serialize response to bytes
		var b bytes.Buffer
		encoder := json.NewEncoder(&b)
		if err := encoder.Encode(response); err != nil {
			msgErrChan <- fmt.Errorf("worker %d - while encoding response: %v", workerId, err)
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
			msgErrChan <- fmt.Errorf("worker %d - while publishing message: %v", workerId, err)
		}

		a.Logger().Printf("[INFO] worker %d - published message: %s", workerId, b.String())

		if err := ch.Ack(msg.DeliveryTag, false); err != nil {
			msgErrChan <- fmt.Errorf("worker %d - while acknowledging delivery of message: %v", workerId, err)
		}
	}

	a.Logger().Printf("[INFO] worker %d - deliveries channel closed", workerId)
}
