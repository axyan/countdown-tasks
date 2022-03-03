package user

import (
	"context"
	"net/http"

	"github.com/axyan/countdown-tasks/service"
)

// InitializeRoutes initializes the routes and handlers for the user service
func (u *UserService) InitializeRoutes() {
	var routes = service.Routes{
		service.Route{Method: http.MethodPost, Path: "/login", HandlerFunc: u.Login},
		service.Route{Method: http.MethodPost, Path: "/users", HandlerFunc: u.CreateUser},
		//service.Route{Method: http.MethodPut, Path: "/users/:userId", HandlerFunc: u.isAuth(u.UpdateUser)},
		service.Route{Method: http.MethodDelete, Path: "/users/:userId", HandlerFunc: u.isAuth(u.DeleteUser)},
	}

	for _, route := range routes {
		u.Router().HandlerFunc(route.Method, route.Path, route.HandlerFunc)
	}
}

// Use as key type for context key
type ctxKey int

// Use as key in context for user id of type string
const idKey ctxKey = ctxKey(0)

// getIDFromContext retrieves user id from request context that was attached
// in middleware isAuth
func getIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(idKey).(string)
	return id, ok
}

// isAuth middleware that checks for a valid token string and attaches user id
// from parsed token to the request context
func (u *UserService) isAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenCookie, err := r.Cookie("token")
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

		ctx := r.Context()
		ctx = context.WithValue(ctx, idKey, userId)
		req := r.WithContext(ctx)
		next(w, req)
	}
}
