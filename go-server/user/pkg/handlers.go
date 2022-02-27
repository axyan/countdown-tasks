package user

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

type Credentials struct {
	Email           string
	Password        string
	ConfirmPassword string
}

func (u *UserService) Login(w http.ResponseWriter, req *http.Request) {
	var newUserCred Credentials
	if err := json.NewDecoder(req.Body).Decode(&newUserCred); err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	newUserCred.Sanitize()
	if err := newUserCred.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusOK)
		return
	}

	//TODO:Validate login

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

	id := uuid.New().String()

	err = ch.Publish(
		"amq.topic",
		"auth.generate",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        []byte(id),
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

func (u *UserService) CreateUser(w http.ResponseWriter, req *http.Request) {
	var newUserCred Credentials
	if err := json.NewDecoder(req.Body).Decode(&newUserCred); err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	newUserCred.Sanitize()
	if err := newUserCred.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusOK)
		return
	}

	emailExists, err := u.EmailExists(newUserCred.Email)
	if err != nil {
		u.Logger().Println(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if !emailExists {
		hashedPassword, err := hashPassword(newUserCred.Password)
		if err != nil {
			u.Logger().Println(err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		if err = u.AddUserToDB(newUserCred.Email, hashedPassword); err != nil {
			u.Logger().Printf("[ERROR] while adding new user %s: %s", newUserCred.Email, err.Error())
			return
		}
		u.Logger().Printf("[INFO] created new user %s", newUserCred.Email)
	} else {
		u.Logger().Printf("[WARNING] new user already exists: %s", newUserCred.Email)
		//TODO: EMAIL PASSWORD RESET
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func (u *UserService) UpdateUser(w http.ResponseWriter, req *http.Request) {
	//TODO: Update user info
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func (u *UserService) DeleteUser(w http.ResponseWriter, req *http.Request) {
	// TODO Middleware to attach user id from JWT
	var userId uint
	err := u.DeleteUserFromDB(userId)
	if err != nil {
		u.Logger().Printf("[ERROR] while deleting user %d: %s", userId, err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusNoContent)
}
