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
	amqp "github.com/rabbitmq/amqp091-go"
)

type IService interface {
	Name() string
	Broker() *amqp.Connection
	Database() *sql.DB
	Logger() *log.Logger
	Router() *httprouter.Router
	Server() *http.Server
	Run() (<-chan os.Signal, error)
	Shutdown(ctx context.Context)
}

type service struct {
	name   string
	broker *amqp.Connection
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

func (s *service) Broker() *amqp.Connection {
	return s.broker
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

	s.broker, err = amqp.Dial(s.config.RabbitMQConnURI)
	if err != nil {
		s.logger.Printf("[ERROR] while opening connection to RabbitMQ: %s", err.Error())
		return nil, err
	}

	ch, err := s.broker.Channel()
	if err != nil {
		s.logger.Printf("[ERROR] while opening RabbitMQ channel: %s", err.Error())
		return nil, err
	}
	defer ch.Close()

	for _, queueName := range s.config.RabbitMQQueues {
		_, err = ch.QueueDeclare(
			queueName,
			false,
			false,
			false,
			false,
			nil,
		)
		if err != nil {
			s.logger.Printf("[ERROR] while declaring RabbitMQ queues: %s", err.Error())
			return nil, err
		}
	}

	if s.config.DBConnURI != "" {
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
	}

	s.router = newRouter()

	s.server = &http.Server{
		Addr:         s.config.Address,
		Handler:      logRequestsMiddleware(s.router, s.logger),
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
			s.logger.Println("[ERROR] while serving server: %s", err.Error())
			s.logger.Println("Closing all open connections...")

			if err := s.broker.Close(); err != nil {
				s.logger.Printf("[ERROR] while closing RabbitMQ connection: %s", err.Error())
			}

			if s.config.DBConnURI != "" {
				if err := s.db.Close(); err != nil {
					s.logger.Printf("[ERROR] while closing database connection: %s", err.Error())
				}
			}

			s.logger.Fatalf("All connections closed")
		}
	}()
	s.logger.Printf("[START] Listening on: %s", s.config.Address)

	return stop, nil
}

func (s *service) Shutdown(ctx context.Context) {
	s.logger.Println("[STOP] Graceful shutdown initiated")

	if err := s.broker.Close(); err != nil {
		s.logger.Printf("[ERROR] while closing RabbitMQ connection: %s", err.Error())
	}

	if s.config.DBConnURI != "" {
		if err := s.db.Close(); err != nil {
			s.logger.Printf("[ERROR] while closing database connection: %s", err.Error())
		}
	}

	s.server.SetKeepAlivesEnabled(false)
	if err := s.server.Shutdown(ctx); err != nil {
		s.logger.Printf("[ERROR] while shutting down server: %s", err.Error())
	}

	s.logger.Println("[STOP] Graceful shutdown completed")
}
