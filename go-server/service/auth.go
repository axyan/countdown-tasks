package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type ValidationResponse struct {
	UserID string `json:id`
	Token  string `json:token`
	Error  string `json:err`
}

func (s *service) Validate(token string) (string, bool, error) {
	ch, err := s.broker.Channel()
	if err != nil {
		s.logger.Printf("[ERROR] while trying to open new channel: %v", err)
		return "", false, err
	}
	defer ch.Close()

	msgs, err := ch.Consume(
		"amq.rabbitmq.reply-to",
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		s.logger.Printf("[ERROR] while trying to consume messages: %v", err)
		return "", false, err
	}

	err = ch.Publish(
		"amq.topic",
		"auth.validate",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        []byte(token),
			ReplyTo:     "amq.rabbitmq.reply-to",
		},
	)
	if err != nil {
		s.logger.Printf("[ERROR] while trying to publish message: %v", err)
		return "", false, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(5*time.Second))
	defer cancel()

	select {
	case <-ctx.Done():
		return "", false, errors.New(http.StatusText(http.StatusInternalServerError))

	case msg := <-msgs:
		//Deserialize response from auth
		var response ValidationResponse
		buf := bytes.NewBuffer(msg.Body)
		decoder := json.NewDecoder(buf)
		if err := decoder.Decode(&response); err != nil {
			s.logger.Printf("[ERROR] while decoding message reply: %v", err)
			return "", false, err
		}

		return response.UserID, true, nil
	}
}
