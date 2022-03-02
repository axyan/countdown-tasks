package user

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"html"
	"net/mail"
	"strings"
	"time"

	"github.com/axyan/countdown-tasks/service"
	amqp "github.com/rabbitmq/amqp091-go"
	"golang.org/x/crypto/bcrypt"
)

// Sanitize sanitizes user input for email and password by trimming whitespace
// and escaping characters: <, >, &, ', and "
func (c *Credentials) Sanitize() {
	c.Email = html.EscapeString(strings.TrimSpace(c.Email))
	c.Password = html.EscapeString(strings.TrimSpace(c.Password))
}

// Validate validates user input for email and password to ensure valid
// format and length
func (c Credentials) Validate() error {
	if _, err := mail.ParseAddress(c.Email); err != nil {
		return errors.New("invalid email")
	}

	switch {
	case len(c.Email) == 0:
		return errors.New("email cannot be empty")
	case len(c.Password) == 0:
		return errors.New("password cannot be empty")
	case len(c.Password) <= 8:
		return errors.New("password must be greater than 8 characters")
	}

	if len(c.ConfirmPassword) != 0 && c.ConfirmPassword != c.Password {
		return errors.New("passwords do not match")
	}

	return nil
}

// hashPassword hashes the provided password with bcrypt
func hashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), 14)
}

// validatePassword validates the provided password with the hashed password
// stored in the user database
func validatePassword(hashedPassword []byte, password string) bool {
	err := bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	return err == nil
}

// NewToken publishes a message to message broker to get new token from auth
// service; returns empty string upon error to indicate internal server error
func (u *UserService) NewToken(userId string) string {
	ch, err := u.Broker().Channel()
	if err != nil {
		u.Logger().Printf("[ERROR] while trying to open new channel: %v", err)
		return ""
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
		u.Logger().Printf("[ERROR] while trying to consume messages: %v", err)
		return ""
	}

	err = ch.Publish(
		"amq.topic",
		"auth.generate",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        []byte(userId),
			ReplyTo:     "amq.rabbitmq.reply-to",
			Expiration:  "5000",
		},
	)
	if err != nil {
		u.Logger().Printf("[ERROR] while trying to publish message: %v", err)
		return ""
	}

	// Set request for token expiration to match 5 seconds from message expiration
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(5*time.Second))
	defer cancel()

	select {
	case <-ctx.Done():
		u.Logger().Println("[ERROR] request to generate token not received by auth service")
		return ""

	case msg := <-msgs:
		//Deserialze response from auth
		var response service.ValidationResponse
		buf := bytes.NewBuffer(msg.Body)
		decoder := json.NewDecoder(buf)
		if err := decoder.Decode(&response); err != nil {
			u.Logger().Printf("[ERROR] while decoding message reply: %v", err)
			return ""
		}

		if response.Error != "" {
			u.Logger().Printf("[ERROR] while generating token: %s", response.Error)
			return ""
		}

		return response.Token
	}
}
