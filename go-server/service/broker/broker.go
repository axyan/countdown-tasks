package broker

import (
	"github.com/axyan/countdown-tasks/service/broker/rabbitmq"
)

type IBroker interface {
	Run() error
}

func NewBroker(addr string) IBroker {
	return rabbitmq.NewRabbitMQBroker(addr)
}
