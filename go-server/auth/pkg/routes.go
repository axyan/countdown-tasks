package auth

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/axyan/countdown-tasks/service"
)

func (a *AuthService) InitializeRoutes() {
	var routes = service.Routes{
		service.Route{Method: http.MethodGet, Path: "/", HandlerFunc: a.Ping},
	}

	for _, route := range routes {
		a.Router().HandlerFunc(route.Method, route.Path, route.HandlerFunc)
	}
}

func (a *AuthService) Ping(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)

	if err := a.Blacklist().Add("token1", 3600); err != nil {
		a.Logger().Printf("[ERROR] %s", err)
	}

	exists, err := a.Blacklist().Exists("token2")
	if err != nil {
		a.Logger().Printf("[ERROR] %s", err)
	}
	a.Logger().Println(exists)

	if err := json.NewEncoder(w).Encode("pong from auth"); err != nil {
		log.Println(err)
	}
}
