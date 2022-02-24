package authentication

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/axyan/countdown-tasks/service"
)

var routesList = service.Routes{
	service.Route{Method: http.MethodGet, Path: "/ping", HandlerFunc: Ping},
}

func GetAllRoutes() service.Routes {
	return routesList
}

func Ping(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode("pong from authentication"); err != nil {
		log.Println(err)
	}
}
