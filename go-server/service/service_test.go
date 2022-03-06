package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

type Response struct {
	Message string `json:"message"`
}

const addr string = "localhost:9000"
const pongResponse string = "pong from service"

var logger *log.Logger = log.New(ioutil.Discard, "", log.LstdFlags)

func TestNewService(t *testing.T) {
	svc := NewService("Test", logger, Config{})
	assert.NotNil(t, svc)
	assert.Equal(t, svc.Name(), "Test")
	assert.NotNil(t, svc.Logger())
}

func TestRun(t *testing.T) {
	// Test for error when address not provided
	svc := NewService("Test", logger, Config{})
	assert.NotNil(t, svc)

	stop, err := svc.Run()
	assert.Nil(t, stop)
	assert.Error(t, err)

	// Test service is running via GET /ping
	svc = NewService("Test", logger, Config{Address: addr})
	assert.NotNil(t, svc)

	stop, err = svc.Run()
	assert.NotNil(t, stop)
	assert.Nil(t, err)

	assert.NotNil(t, svc.Server())
	ctx := context.Background()
	defer svc.Shutdown(ctx)

	assert.NotNil(t, svc.Router())
	svc.Router().HandlerFunc(http.MethodGet, "/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(&Response{Message: pongResponse}); err != nil {
			t.Errorf("error encoding message: %v", err)
		}
	})

	res, err := http.Get(fmt.Sprintf("http://%s/ping", addr))
	if err != nil {
		t.Errorf("error pinging service: %v", err)
	}
	defer res.Body.Close()

	var response Response
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		t.Errorf("error decoding json response: %v", err)
	}

	assert.Equal(t, pongResponse, response.Message)
	assert.Equal(t, http.StatusOK, res.StatusCode)
}

func TestShutdown(t *testing.T) {
	svc := NewService("Test", logger, Config{Address: addr})
	assert.NotNil(t, svc)

	stop, err := svc.Run()
	assert.NotNil(t, stop)
	assert.Nil(t, err)

	assert.NotNil(t, svc.Server())
	ctx := context.Background()
	svc.Shutdown(ctx)

	// should return error since we gracefully shutdown server prior
	err = svc.Server().ListenAndServe()
	assert.Equal(t, http.ErrServerClosed, err)
}
