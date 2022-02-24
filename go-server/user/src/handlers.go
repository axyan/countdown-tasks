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

		if err = u.AddUserToDB(newUserCred.Email, hashedPassword); err != nil {
			u.Logger().Printf("[ERROR] while adding new user %s: %s", newUserCred.Email, err.Error())
			return
		}
		u.Logger().Printf("[INFO] created new user %s", newUserCred.Email)
	} else {
		u.Logger().Printf("[WARNING] while adding new user that exists: %s", newUserCred.Email)
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
