package service

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/julienschmidt/httprouter"
	_ "github.com/lib/pq"
)

type IService interface {
	Name() string
	Database() *sql.DB
	Logger() *log.Logger
	Router() *httprouter.Router
	Server() *http.Server
	Run() (<-chan os.Signal, error)
	Shutdown(ctx context.Context)
}

type service struct {
	name   string
	db     *sql.DB
	logger *log.Logger
	router *httprouter.Router
	server *http.Server
	config Config
}

func NewService(name string, config Config) IService {
	return &service{
		name:   name,
		logger: log.New(os.Stdout, fmt.Sprintf("[%s Service] ", name), log.LstdFlags),
		config: config,
	}
}

func (s *service) Name() string {
	return s.name
}

func (s *service) Database() *sql.DB {
	return s.db
}

func (s *service) Logger() *log.Logger {
	return s.logger
}

func (s *service) Router() *httprouter.Router {
	return s.router
}

func (s *service) Server() *http.Server {
	return s.server
}

func (s *service) Run() (<-chan os.Signal, error) {
	var err error
	s.db, err = sql.Open(s.config.DBDriver, s.config.DBConnURI)
	if err != nil {
		s.logger.Printf("[ERROR] while opening sql database: %s", err.Error())
		return nil, err
	}
	// Ensures valid connection since sql.Open does not
	// always establish a connection to the database
	if err := s.db.Ping(); err != nil {
		s.logger.Printf("[ERROR] while pinging sql database: %s", err.Error())
		return nil, err
	}

	s.router = newRouter()

	s.server = &http.Server{
		Addr:         s.config.Address,
		Handler:      s.router,
		ErrorLog:     s.logger,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop,
		os.Interrupt,
		syscall.SIGTERM,
		syscall.SIGQUIT,
	)

	go func() {
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			if err := s.db.Close(); err != nil {
				s.logger.Printf("[ERROR] while closing database connection: %s", err.Error())
			}
			s.logger.Fatalf("[ERROR] while serving server: %s", err.Error())
		}
	}()
	s.logger.Printf("[START] Listening on: %s", s.config.Address)

	return stop, nil
}

func (s *service) Shutdown(ctx context.Context) {
	s.logger.Println("[STOP] Graceful shutdown initiated")

	if err := s.db.Close(); err != nil {
		s.logger.Printf("[ERROR] while closing database connection: %s", err.Error())
	}

	s.server.SetKeepAlivesEnabled(false)
	if err := s.server.Shutdown(ctx); err != nil {
		s.logger.Printf("[ERROR] while shutting down server: %s", err.Error())
	}

	s.logger.Println("[STOP] Graceful shutdown completed")
}
