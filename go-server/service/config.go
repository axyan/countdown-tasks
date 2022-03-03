package service

type Config struct {
	Address         string
	DBDriver        string
	DBConnURI       string
	RabbitMQConnURI string
	RabbitMQQueues  []string
}