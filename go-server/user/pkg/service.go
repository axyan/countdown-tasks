package user

import (
	"context"
	"os"

	"github.com/axyan/countdown-tasks/service"
)

type UserService struct {
	service.IService
}

func NewUserService(config service.Config) *UserService {
	return &UserService{
		service.NewService("User", config),
	}
}

func (u *UserService) Start() (<-chan os.Signal, error) {
	stop, err := u.Run()
	if err != nil {
		return nil, err
	}

	u.InitializeRoutes()

	return stop, nil
}

func (u *UserService) Stop(ctx context.Context) {
	u.Shutdown(ctx)
}
