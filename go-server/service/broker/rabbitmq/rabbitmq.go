package rabbitmq

import (
	amqp "github.com/rabbitmq/amqp091-go"
)

type rbroker struct {
	addr string
	conn *amqp.Connection
}

func NewRabbitMQBroker(addr string) *rbroker {
	return &rbroker{addr: addr}
}

func (r *rbroker) Run() error {
	var err error
	r.conn, err = amqp.Dial(r.addr)
	if err != nil {
		return err
	}
	return nil
}
