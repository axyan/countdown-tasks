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

	for _, route := range routes {
		u.Router().HandlerFunc(route.Method, route.Path, route.HandlerFunc)
	}
}
