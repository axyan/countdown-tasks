package user

import (
	"net/http"

	"github.com/axyan/countdown-tasks/service"
)

func (u *UserService) InitializeRoutes() {
	var routes = service.Routes{
		service.Route{Method: http.MethodPost, Path: "/users", HandlerFunc: u.CreateUser},
		service.Route{Method: http.MethodPut, Path: "/users/:userId", HandlerFunc: u.UpdateUser},
		service.Route{Method: http.MethodDelete, Path: "/users/:userId", HandlerFunc: u.DeleteUser},
	}

	logging := u.LoggingMiddleware

	for _, route := range routes {
		u.Router().HandlerFunc(route.Method, route.Path, logging(route.HandlerFunc))
	}
}

func (u *UserService) LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u.Logger().Printf("%s %s", r.Method, r.URL.Path)
		next(w, r)
	}
}
