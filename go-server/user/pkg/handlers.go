package user

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

type Credentials struct {
	Email           string
	Password        string
	ConfirmPassword string
}

func (u *UserService) Login(w http.ResponseWriter, req *http.Request) {
	// TODO: Set same headers in middleware + gzip
	var userLogin Credentials
	if err := json.NewDecoder(req.Body).Decode(&userLogin); err != nil {
		u.Logger().Printf("[ERROR] while parsing request body: %v", err)
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	userLogin.Sanitize()
	if err := userLogin.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusOK)
		return
	}

	userId, err := u.ValidateLogin(userLogin.Email, userLogin.Password)
	if err != nil {
		u.Logger().Printf("[ERROR] while validating user login: %v", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if userId == "" {
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		// OK 200 status code to maintain user privacy
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(map[string]string{"message": "invalid email and/or password"}); err != nil {
			u.Logger().Printf("[ERROR] while encoding response: %v", err)
		}
		return
	}

	// Returns empty string if error while getting new token
	token := u.NewToken(userId)
	if token == "" {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	cookie := &http.Cookie{
		Name:     "token",
		Value:    token,
		MaxAge:   3600,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	}
	http.SetCookie(w, cookie)

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func (u *UserService) CreateUser(w http.ResponseWriter, req *http.Request) {
	var newUserCred Credentials
	if err := json.NewDecoder(req.Body).Decode(&newUserCred); err != nil {
		u.Logger().Printf("[ERROR] while parsing request body: %v", err)
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
		u.Logger().Printf("[ERROR] while checking if email unique: %v", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if !emailExists {
		hashedPassword, err := hashPassword(newUserCred.Password)
		if err != nil {
			u.Logger().Printf("[ERROR] while hashing password: %v", err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		if err = u.AddUserToDB(newUserCred.Email, hashedPassword); err != nil {
			u.Logger().Printf("[ERROR] while adding new user %s: %v", newUserCred.Email, err)
			return
		}
		u.Logger().Printf("[INFO] created new user: %s", newUserCred.Email)
	} else {
		u.Logger().Printf("[WARNING] new user already exists: %s", newUserCred.Email)
		//TODO: EMAIL PASSWORD RESET - EMAIL SERVICE
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func (u *UserService) UpdateUser(w http.ResponseWriter, req *http.Request) {
	tokenCookie, err := req.Cookie("token")
	if err != nil {
		u.Logger().Printf("[ERROR] while trying to parse 'token' cookie: %v", err)
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}
	u.Logger().Println(tokenCookie.Value)

	//TODO: Update user info

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
}

func (u *UserService) DeleteUser(w http.ResponseWriter, req *http.Request) {
	tokenCookie, err := req.Cookie("token")
	if err != nil {
		u.Logger().Printf("[ERROR] while trying to parse token cookie: %v", err)
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	userId, isValid, err := u.Validate(tokenCookie.Value)
	if err != nil || !isValid {
		if err != nil {
			u.Logger().Printf("[ERROR] while validating cookie: %v", err)
		}
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	userUUID, err := uuid.Parse(userId)
	if err != nil {
		u.Logger().Printf("[ERROR] while parsing user id: %v", err)
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	u.Logger().Println(userUUID)

	//err = u.DeleteUserFromDB(userUUID)
	//if err != nil {
	//	u.Logger().Printf("[ERROR] while deleting user %v: %v", userId, err)
	//	http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	//	return
	//}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusNoContent)
}
