package user

import (
	"encoding/json"
	"net/http"

	"github.com/axyan/countdown-tasks/service"
	amqp "github.com/rabbitmq/amqp091-go"
)

func (u *UserService) InitializeRoutes() {
	var routes = service.Routes{
		//service.Route{Method: http.MethodPost, Path: "/temp", HandlerFunc: u.temp},
		service.Route{Method: http.MethodPost, Path: "/api/session", HandlerFunc: u.Login},
		service.Route{Method: http.MethodPost, Path: "/users", HandlerFunc: u.CreateUser},
		//service.Route{Method: http.MethodPut, Path: "/users/:userId", HandlerFunc: u.UpdateUser},
		service.Route{Method: http.MethodDelete, Path: "/users/:userId", HandlerFunc: u.DeleteUser},
	}

	for _, route := range routes {
		u.Router().HandlerFunc(route.Method, route.Path, route.HandlerFunc)
	}
}

func (u *UserService) temp(w http.ResponseWriter, r *http.Request) {
	type Res struct {
		Token string
	}
	var temp Res
	if err := json.NewDecoder(r.Body).Decode(&temp); err != nil {
		http.Error(w, "Error reading token from body", http.StatusOK)
		return
	}

	ch, err := u.Broker().Channel()
	if err != nil {
		u.Logger().Println(err)
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
		u.Logger().Println(err)
	}

	err = ch.Publish(
		"amq.topic",
		"auth.validate",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        []byte(temp.Token),
			ReplyTo:     "amq.rabbitmq.reply-to",
		},
	)
	if err != nil {
		u.Logger().Println(err)
	}

	msg := <-msgs

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(string(msg.Body)); err != nil {
		u.Logger().Println(err)
	}
}
