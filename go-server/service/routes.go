package service

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

// Encapsulate router?

type Route struct {
	Method      string
	Path        string
	HandlerFunc http.HandlerFunc
}

type Routes []Route

func newRouter() *httprouter.Router {
	router := httprouter.New()
	router.HandleMethodNotAllowed = false
	return router
}
