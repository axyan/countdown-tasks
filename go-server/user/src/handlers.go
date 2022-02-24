package user

import (
	"encoding/json"
	"net/http"
)

type Credentials struct {
	Email           string
	Password        string
	ConfirmPassword string
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

		statement := "INSERT INTO users (email, password) VALUES ($1, $2);"
		_, err = u.Database().Exec(statement, newUserCred.Email, hashedPassword)
		if err != nil {
			u.Logger().Printf("[ERROR] %s for %s", err.Error(), newUserCred.Email)
			return
		}
		u.Logger().Printf("CREATED USER FOR %s", newUserCred.Email)
	} else {
		//TODO: EMAIL PASSWORD RESET
		u.Logger().Printf("[ERROR] USER %s ALREADY EXISTS", newUserCred.Email)
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func (u *UserService) UpdateUser(w http.ResponseWriter, req *http.Request) {
	//TODO
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func (u *UserService) DeleteUser(w http.ResponseWriter, req *http.Request) {
	// TODO Middleware to attach user id from JWT
	var userId uint
	statement := "DELETE FROM users WHERE id = $1;"
	_, err := u.Database().Exec(statement, userId)
	if err != nil {
		u.Logger().Printf("[ERROR] while deleting user with ID %d: %s", userId, err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusNoContent)
}
